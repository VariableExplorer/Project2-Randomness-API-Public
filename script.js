class Game {
    constructor(elementId, containerId, roomAreaId, inputRooms) {
        this.player = document.querySelector(`#${elementId}`);
        this.background = document.querySelector(`#${containerId}`);
        this.roomArea = document.querySelector(`#${roomAreaId}`);
        this.coordinates = document.querySelector('#coordinates');
        this.enemy = null;
        this.score = 0;
        this.gameOver = false;

        //Logic for rooms and game score:
        //Every room will have loot. Loot gives you 50 points.
        //Every time you enter a new room, you get 10 points.
        //At the end of the game, you'll get 1 point for every
        //second you survived. If a room has an enemy, it will
        //randomly spawn at some point in the room. Loot will
        //also randomly spawn at some point in the room. When
        //a player enters a room, they will always spawn at the
        //top entrance of the room, unless I have enough time
        //to ensure room memory.
        this.rooms = []
        inputRooms.forEach(room => {
            this.rooms.push(room);
        })
        
        // Player position
        this.playerX = 50;
        this.playerY = 50;

        // Enemy position
        this.enemyX = 0;
        this.enemyY = 0;

        //Current room
        this.currentRoom = this.rooms[0]
        
        // Movement settings
        this.speed = 2;
        
        // Key states
        this.keys = {};
        this.enemyKeys = [{'w':false}, {'a':false}, {'s':false}, {'d':false}];
        
        // Initialize position
        this.updatePosition();
        
        // Bind events
        this.bindEvents();

        // Draw initial room
        this.drawRoom(this.rooms[0])
        
        // Start game loop
        this.gameLoop();
    }
    
    bindEvents() {
        // Keydown events
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            e.preventDefault();
        });
        
        // Keyup events
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            e.preventDefault();
        });
    }

    //Claude constructed collision detection function
    checkCollision(element1, element2) {
        if (!element1 || !element2) return false;

        const rect1 = element1.getBoundingClientRect();
        const rect2 = element2.getBoundingClientRect();

        return !(rect1.right < rect2.left || 
                rect1.left > rect2.right || 
                rect1.bottom < rect2.top || 
                rect1.top > rect2.bottom);
    }

    drawRoom(newRoom){
        //Set room and width to draw doors.
        this.roomArea.style.width = newRoom.width + "px"
        this.roomArea.style.height = newRoom.height + "px"

        //Delete old doors.
        const oldDoors = this.roomArea.querySelectorAll('.door')
        oldDoors.forEach(door => door.remove())

        //Draw new doors.
        for(let i = 0; i < newRoom.doors.length; i++){
            const door = document.createElement("div")
            door.className = "door"
            if (newRoom.doors[i][0] == 0 || newRoom.doors[i][0] == newRoom.width) {
                door.style.width = "10px"
                door.style.height = "25px"
                door.style.left = (newRoom.doors[i][0] - 10 / 2) + "px";
                door.style.top = (newRoom.doors[i][1] - 25 / 2) + "px";
            }
            else {
                door.style.width = "25px"
                door.style.height = "10px"
                door.style.left = newRoom.doors[i][0]-25 + "px"
                door.style.top = newRoom.doors[i][1]-10 + "px"
                door.style.left = (newRoom.doors[i][0] - 25 / 2) + "px";
                door.style.top = (newRoom.doors[i][1] - 10 / 2) + "px";
            }

            this.roomArea.appendChild(door)
        }

        //Draw loot
        const oldLoot = this.roomArea.querySelectorAll('.loot')
        oldLoot.forEach(loot => loot.remove())
        const loot = document.createElement("div")
        loot.className = "loot"
        loot.style.left = Math.floor(Math.random() * (newRoom.width - 10)) + "px"
        loot.style.top = Math.floor(Math.random() * (newRoom.height - 10)) + "px"
        this.roomArea.appendChild(loot)

        //Draw enemy if room has one.
        const oldEnemy = this.roomArea.querySelectorAll('.enemy')
        oldEnemy.forEach(enemy => enemy.remove())
        if(newRoom.enemy){
            console.log("This room has an enemy.")
            const enemy = document.createElement("div")
            enemy.className = "enemy"
            this.enemyX = Math.floor(Math.random() * (newRoom.width - 10))
            this.enemyY = Math.floor(Math.random() * (newRoom.height - 10))
            enemy.style.left = this.enemyX  + "px";
            enemy.style.top = this.enemyY  + "px";
            this.roomArea.appendChild(enemy)
            this.enemy = document.querySelector('.enemy')
        }
    }
    
    update() {
        // Determine current speed
        const currentSpeed = this.speed;
        
        // Handle movement
        //Initially constructed by Claude, though I altered it to give us a smaller playing area within the larger game container.
        if (this.keys['w'] || this.keys['arrowup']) {
            this.playerY = Math.max(0, this.playerY - currentSpeed);
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            this.playerY = Math.min(this.roomArea.clientHeight - this.player.offsetHeight, this.playerY + currentSpeed);
        }
        if (this.keys['a'] || this.keys['arrowleft']) {
            this.playerX = Math.max(0, this.playerX - currentSpeed);
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            this.playerX = Math.min(this.roomArea.clientWidth - this.player.offsetWidth, this.playerX + currentSpeed);
        }

        //Get enemy keys and move enemy.
        if( this.enemy ){

            this.getEnemyKeys();

            if (this.enemyKeys['w']) {
                this.enemyY = Math.max(0, this.enemyY - (currentSpeed-0.5)+(this.score/10000));
            }
            if (this.enemyKeys['s']) {
                this.enemyY = Math.min(this.roomArea.clientHeight - this.enemy.offsetHeight, this.enemyY + (currentSpeed-0.5)+(this.score/10000));
            }
            if (this.enemyKeys['a']) {
                this.enemyX = Math.max(0, this.enemyX - (currentSpeed-0.5)+(this.score/10000));
            }
            if (this.enemyKeys['d']) {
                this.enemyX = Math.min(this.roomArea.clientWidth - this.enemy.offsetWidth, this.enemyX + (currentSpeed-0.5)+(this.score/10000));
            }
        }
        
        this.updatePosition();

        //Collision checking
        this.checkDoorCollisions();

        if(this.checkCollision(this.player, this.roomArea.querySelector('.loot'))){
            console.log("Player collected loot!");
            this.roomArea.querySelector('.loot').remove();
            this.score += 50;
        }

        if( this.enemy && this.checkCollision(this.player, this.enemy)){
            console.log("Player hit enemy! Game Over!");
            this.gameOver = true;
        }
    }

    //Simulates the enemy pressing keys to reach the player.
    getEnemyKeys(){
        this.enemyKeys = [{'w':false}, {'a':false}, {'s':false}, {'d':false}];
        //Press D to move right
        if (this.playerX > this.enemyX) {
            console.log("Enemy moving right");
            this.enemyKeys['d'] = true;
        }
        //Press A to move left
        if (this.playerX < this.enemyX) {
            console.log("Enemy moving left");
            this.enemyKeys['a'] = true;
        }
        //Press W to move up
        if (this.playerY < this.enemyY) {
            console.log("Enemy moving up");
            this.enemyKeys['w'] = true;
        }
        //Press S to move down
        if( this.playerY > this.enemyY) {
            console.log("Enemy moving down");
            this.enemyKeys['s'] = true;
        }
    }

    //Function by Claude that checks the collision for each door.
    //Although, I wrote the part that teleports the player to a new room.
    checkDoorCollisions() {
        let collisionCount = 0;
        const doors = this.roomArea.querySelectorAll('.door');
        doors.forEach((door) => {
            if (this.checkCollision(this.player, door)) {
                console.log(`Player is touching door!`);
                const newRoom = this.rooms[Math.floor(Math.random() * (this.rooms.length-1)+1)]
                this.movePlayerTo(newRoom.width / 2, 20, 0.01);
                this.drawRoom(newRoom);
            }
        });
    }
    
    updatePosition() {
        this.player.style.left = this.playerX + 'px';
        this.player.style.top = this.playerY + 'px';
        if (this.enemy){
            this.enemy.style.left = this.enemyX + 'px';
            this.enemy.style.top = this.enemyY + 'px';
        }
        this.coordinates.textContent = `Score: ${this.score}`;
    }
    
    gameLoop() {
        if (this.gameOver){
            this.roomArea.style.display = "none";
            document.querySelector("#GAME_OVER").style.display = "block";
            return;
        };
        this.update();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    // Method to move to specific coordinates (Generated by Claude. I had absolutely no idea how to do this in JavaScript.)
    movePlayerTo(targetX, targetY, duration) {
        const startX = 75;
        const startY = 0;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (smooth movement)
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            this.playerX = startX + (targetX - startX) * easeProgress;
            this.playerY = startY + (targetY - startY) * easeProgress;
            
            this.updatePosition();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

}

//Should clear the instance of game when the player restarts.
//I don't think we need to worry about memory, but good practice, right?
let game = null;

let restartButton = document.querySelector('.restart-button');

let startButton = document.querySelector('.start-button');
let roomArea = document.querySelector('#room');
let coordinates = document.querySelector('#coordinates');
let startScreen = document.querySelector('#START_GAME');

function startGame() {
    startScreen.style.display = "none";
    roomArea.style.display = "block";
    coordinates.style.display = "block";
    success = true;
    fetch("https://api.jsonbin.io/v3/qs/68b971bc43b1c97be936728e").
    then(function(response){
        console.log(response);
        response.json().then(function(data) {
            console.log("The data: ", data)
            try{
                if (data.record[0].width && data.record[0].height && data.record[0].doors && data.record[0].hasEnemy !== undefined) {
                    console.log("Room data structure is valid."); 
                }   
            }
            catch{
                console.error("Invalid room data structure");
                success = false;
            }
            if (success) {
                const game = new Game('player', 'gameContainer', "room", data.record);
                const startX = game.currentRoom.width / 2;
                const startY = 0;
                game.movePlayerTo(startX, startY, 0.01);
            }
        })
    })
    .catch(function(err){
        console.error("Error fetching rooms:", err);
        success = false;
    });
}

// Initialize player when start button is clicked
startButton.onclick = startGame;

restartButton.onclick = function() {
    document.querySelector("#GAME_OVER").style.display = "none";
    document.querySelector("#ERROR").style.display = "none";
    game = null;
    startGame();
}

/* In case the paste bin goes away.
[
  {
    "width": 150,
    "height": 150,
    "doors": [
      [
        0,
        75
      ],
      [
        75,
        150
      ],
      [
        150,
        75
      ]
    ],
    "enemy": false
  },
  {
    "width": 200,
    "height": 200,
    "doors": [
      [
        0,
        100
      ],
      [
        100,
        200
      ],
      [
        200,
        100
      ],
      [
        100,
        0
      ]
    ],
    "enemy": true
  },
  {
    "width": 300,
    "height": 300,
    "doors": [
      [
        0,
        150
      ],
      [
        150,
        300
      ],
      [
        300,
        150
      ],
      [
        150,
        0
      ]
    ],
    "enemy": true
  },
  {
    "width": 200,
    "height": 300,
    "doors": [
      [
        0,
        150
      ],
      [
        100,
        300
      ],
      [
        200,
        150
      ],
      [
        100,
        0
      ]
    ],
    "enemy": true
  },
  {
    "width": 300,
    "height": 200,
    "doors": [
      [
        0,
        100
      ],
      [
        150,
        200
      ],
      [
        300,
        100
      ],
      [
        150,
        0
      ]
    ],
    "enemy": true
  },
  {
    "width": 100,
    "height": 200,
    "doors": [
      [
        50,
        0
      ],
      [
        50,
        200
      ]
    ],
    "enemy": false
  },
  {
    "width": 100,
    "height": 300,
    "doors": [
      [
        50,
        0
      ],
      [
        50,
        300
      ]
    ],
    "enemy": false
  }
]


*/
