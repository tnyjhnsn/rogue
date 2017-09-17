// global vars
var gVars = {};

// bitwise values
gVars.wall = {}
gVars.wall.WALL = 1;
gVars.wall.SEEN = 2;
gVars.wall.FOV = 4;
gVars.wall.STAIRS_DOWN = 8;
gVars.wall.STAIRS_UP = 16;

gVars.wall.DIJKSTRA_SEED = 1000;

gVars.dir = {};
gVars.dir.N = 0;
gVars.dir.NE = 1;
gVars.dir.E = 2;
gVars.dir.SE = 3;
gVars.dir.S = 4;
gVars.dir.SW = 5;
gVars.dir.W = 6;
gVars.dir.NW = 7;

gVars.message = {}
gVars.message.PLAYER = "msg-player";
gVars.message.MONSTER = "msg-monster";
gVars.message.GAME = "msg-game";

gVars.message.GOOD = "msg-good";
gVars.message.WARNING = "msg-warning";
gVars.message.URGENT = "msg-urgent";

gVars.dice = {}
gVars.dice.TO_HIT = 36;

// RogueLike namespace
var RL = {}

// common functions
RL.getRandom = function(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

RL.dice = function(min, max) {
	return function() {
		return RL.getRandom(min, max);
	}
}

/*
* RogueLike Dungeon
* To hold any number of Dungeon Levels
*/

RL.Dungeon = {
	name: "RoGéMoN",
	version: "1.0.0",
	credits: "Design & Code by Tony",
	player: "",
	level: "",
	levels: [],
	messages: [],
	turn: 0,
	summonsBoss: false,
	congratulations: false,
	eogMessage: "",
	createLevel: function() {
		var lvl = this.levels.length;
		var level = new RLD.Level(lvl);
		this.levels.push(level);
		return level;
	},
	setMessage: function(text, className) {
		this.messages.push({text: text, className: className});
	}
}

// shorthand
var RLD = RL.Dungeon;

// Dungeon Level
// Dijkstra is a form of AI
// http://www.roguebasin.com/index.php?title=Dijkstra

RLD.Level = function(lvl) {
	this.lvl = lvl;
	if (lvl == 0) {
		this.rows = 8;
		this.cols = 8;	
	} else if (this.lvl == 5) {
		this.rows = 21;
		this.cols = 21;
	} else {
		this.rows = RL.getRandom(50, 60);
		this.cols = RL.getRandom(50, 60);
	}
	this.tiles = [];
	this.specialTiles = [];
	this.monsters = [];
	this.lastPlayerLocation = 0;
	this.lightsOn = (lvl == 0 || lvl == 5);
	this.init();
}

// shorthand
var RLDL = RLD.Level;

RLDL.prototype.init = function() {
	this.createTiles();
	if (this.lvl > 0 && this.lvl < 5 ) this.createCave();
	if (this.lvl == 5) this.createBossCave();
	if (this.lvl < 5) this.createStairs(gVars.wall.STAIRS_DOWN, this.getRandomTile());
	if (this.lvl == 3) {
		// place the chest first, so that mould won't grow on it
		this.createChest();
	}
	this.createDijkstraNeighbours();
	this.createDijkstraMap(this.getRandomTile(), this.tiles, "wander");
	this.placeActors();
}

RLDL.prototype.createStairs = function(way, location) {
	switch (way) {
	case gVars.wall.STAIRS_DOWN:
		var stairs = new RLDA.StairsDown();
		break;
	case gVars.wall.STAIRS_UP:
		var stairs = new RLDA.StairsUp();
		break;			
	}
	stairs.move(location);
	stairs.location.status |= way;
}

RLDL.prototype.placeActors = function() {
	var monstersForLevel = RLDA.Monster.getMonstersForLevel(this.lvl);
	monstersForLevel.forEach(function(monster) {
		for (var i = 0; i < monster.amount; i++) {
			var m = new monster.monster;
			m.init(this, this.getRandomTile());
			if (RL.getRandom(1, 100) <= 20) {
				new RLDAI.Gold().move(m.inventory);
			}
			if (this.lvl > 2 && RL.getRandom(1, 100) <= 10) {
				var item = new RLDAI.HealthPotion();
				item.trade.cost = 0;
				item.move(m.inventory);
			}
			if (this.lvl > 2 && RL.getRandom(1, 100) <= 5) {
				var item = new RLDAI.AcidRain();
				item.trade.cost = 0;
				item.move(m.inventory);
			}
			if (this.lvl > 2 && RL.getRandom(1, 100) <= 5) {
				var item = new RLDAI.DragonBreath();
				item.trade.cost = 0;
				item.move(m.inventory);
			}
		}
	}.bind(this))
	var itemsForLevel = RLDA.Item.getItemsForLevel(this.lvl);
	itemsForLevel.forEach(function(item) {
		for (var i = 0; i < item.amount; i++) {
			var it = new item.item;
			it.move(this.getRandomTile());
		}
	}.bind(this))
	if (this.lvl > 0 && this.lvl < 5) {
		while (this.specialTiles.length < 3) {
			this.specialTiles.push(this.makeRandomSpecialTile());
		}	
	}
	this.specialTiles.forEach(function(tile) {
		var adamantite = new RLDAI.Adamantite();
		adamantite.move(tile);
	})
	if (this.lvl == 4) {
		var shield = new RLDAI.ShieldHaradrim();
		shield.move(this.monsters[0].location);
	}
}

RLDL.prototype.makeRandomSpecialTile = function() {
	var i = 0;
	do { i = RL.getRandom(0, this.tiles.length - 1); }
	while (!this.tiles[i].isWall());
	return this.tiles[i];
}

// create each tile and keep a record of each tiles immediate
// neighbours
RLDL.prototype.createTiles = function() {
	var tiles = [];
	var rows = this.rows;
	var cols = this.cols;
	for (var i = 0; i < rows; i++) {
		var nRow = (i == 0 ? rows - 1 : i - 1);
		var sRow = (i == rows - 1 ? 0 : i + 1);
		for(var j = 0; j < cols; j++) {
			var eCol = (j == cols - 1 ? 0 : j + 1);
			var wCol = (j == 0 ? cols - 1 : j - 1);
			var tile = new RLDL.Tile(i, j, this);
			tile.tempNeighbours = this.getNeighbourIndexes(i, j, nRow, eCol, sRow, wCol),
			tiles.push(tile);
		}
	}
	tiles.forEach(function(tile) {
		tile.tempNeighbours.forEach(function(temp) {
			tile.neighbours.push(tiles[temp]);
		});
		delete tile.tempNeighbours;
	});
	this.tiles = tiles;
}

RLDL.prototype.createChest = function() {
	var chest = new RLDA.TreasureChest();
	chest.move(this.getRandomTile());
	chest.location.name = "Treasure Chest";
	chest.location.locked = true;
	var scroll = new RLDAI.SummonsBoss();
	var health = new RLDAI.HealthPotion();
	var acid = new RLDAI.AcidRain();
	scroll.trade.cost = 0;
	health.trade.cost = 0;
	acid.trade.cost = 0;
	scroll.move(chest.location);
	health.move(chest.location);
	acid.move(chest.location);
}

RLDL.prototype.createTown = function() {
	var shop = new RLDA.Shop();
	shop.move(this.getRandomTile());
	var pick = new RLDAI.Pick();
	var scroll = new RLDAI.SummonsBoss();
	var remover = new RLDAI.MouldRemover();
	pick.move(shop.location);
	scroll.move(shop.location);
	remover.move(shop.location);
	var playerHouse = new RLDA.House();
	playerHouse.move(this.getRandomTile());
	var haunted = new RLDA.HauntedHouse();
	haunted.move(this.getRandomTile());
	haunted.location.name = "Haunted House";
	haunted.location.locked = true;
	var congratulations = new RLDAI.Congratulations();
	congratulations.move(haunted.location);
	var inn = new RLDA.Inn();
	inn.move(this.getRandomTile());
	var wine = new RLDAI.Wine();
	wine.move(inn.location);
	var morgaine = new RLDA.Morgaine();
	morgaine.move(this.getRandomTile());
	var health = new RLDAI.HealthPotion();
	var acid = new RLDAI.AcidRain();
	var fire = new RLDAI.DragonBreath();
	health.move(morgaine.location);
	acid.move(morgaine.location);
	fire.move(morgaine.location);

	// //	get player to level 4
	// 	var ring1 = new RLDAI.RingStr();
	// 	ring1.move(RLD.player.inventory);
	// 	var ring2 = new RLDAI.RingTulkas();
	// 	ring2.move(RLD.player.body.ringR);
	// 	var hammer = new RLDAI.Hammer();
	// 	hammer.move(RLD.player.body.weapon);
	// 	var armour = new RLDAI.AdamantiteArmour();
	// 	armour.move(RLD.player.body.armour);
	// 	var bow = new RLDAI.LongBow();
	// 	bow.move(RLD.player.body.bow);
	// 	var arrows = new RLDAI.Arrows();
	// 	arrows.move(RLD.player.body.quiver);
	// 	var scroll = new RLDAI.SummonsBoss();
	// 	var potion1 = new RLDAI.DragonBreath();
	// 	var potion2 = new RLDAI.HealthPotion();
	// 	scroll.move(RLD.player.inventory);
	// 	potion1.move(RLD.player.inventory);
	// 	potion2.move(RLD.player.inventory);

	return playerHouse;
}

// a modified version of game of life algorithm to make a cave dungeon
RLDL.prototype.createCave = function () {
	var numberNeighbourWalls;
	this.tiles.forEach(function(tile) {
		tile.status = RL.getRandom(1, 100) <=10 ? gVars.wall.WALL : 0;
	});
	for (var iter = 0; iter < 8; iter++) {
		this.tiles.forEach(function(tile) {
			numberNeighbourWalls = 0;
			tile.neighbours.forEach(function(neighbour) {
				numberNeighbourWalls += (neighbour.isWall() ? 1 : 0);
			});
			if (tile.isWall()) {
				tile.nextStatus = (numberNeighbourWalls >= 1 && numberNeighbourWalls <= 7);
			} else {
				tile.nextStatus = (numberNeighbourWalls == 3);
			}
		});
		this.tiles.forEach(function(tile) {
			tile.status = (tile.nextStatus ? gVars.wall.WALL : 0);
		});
	}

	// cleanup most locked, blank tiles
	for (var iter = 8; iter >= 3; iter--) {
		this.tiles.forEach(function(tile) {
			numberNeighbourWalls = 0;
			tile.neighbours.forEach(function(neighbour) {
				numberNeighbourWalls += (neighbour.isWall() ? 1 : 0);
			});
			if (!tile.isWall()) {
				tile.nextStatus = (numberNeighbourWalls >= iter);
			}
		});
		this.tiles.forEach(function(tile) {
			tile.status = (tile.nextStatus ? gVars.wall.WALL : 0);
		});
	}

	// open border passages around the vary edge of the map
	this.tiles.filter(function(tile) {
		return tile.row == 0 || tile.row == this.rows - 1
			|| tile.col == 0 || tile.col == this.cols - 1;
	}.bind(this)).forEach(function(tile) {
		tile.status = 0;
	});

	// recognise nice spots to put valuables
	this.specialTiles = this.tiles.filter(function(tile) {
		var walls = tile.neighbours.filter(function(neighbour) {
			return neighbour.isWall();
		});
		// some cleanup on the way through
		delete tile.nextStatus;
		return !tile.isWall() && walls.length >= 7;
	});
}

RLDL.prototype.createBossCave = function() {
	// TODO add centerpiece to floor
}

RLDL.prototype.createDijkstraNeighbours = function() {
	this.tiles.filter(function(tile) {
		return !tile.isWall() || !tile.isOccupied();
	}).forEach(function(tile) {
		for (var key in gVars.dir) {
			if (tile.canGo(gVars.dir[key])) {
				tile.dijkstraNeighbours.push(tile.neighbours[gVars.dir[key]]);
			}
		}
	});
}

RLDL.prototype.createDijkstraMap = function(zeroTile, area, map) {
	zeroTile.dijkstraMaps[map] = 0;
	var min;
	var finished;
	var notWall = area.filter(function(tile) {
		return !tile.isWall();
	});
	do {
		finished = true;
		notWall.forEach(function(tile) {
			min = tile.getMinDijkstra(map);
			if (tile.dijkstraMaps[map] > min + 1) {
				tile.dijkstraMaps[map] = min + 1;
				finished = false;
			}
		});
	} while (!finished);
}

// utility function
RLDL.prototype.getNeighbourIndexes = function(row, col, nRow, eCol, sRow, wCol) {
	var N = this.getIndexFromCoords(nRow, col);
	var NE = this.getIndexFromCoords(nRow, eCol);
	var E = this.getIndexFromCoords(row, eCol);
	var SE = this.getIndexFromCoords(sRow, eCol);
	var S = this.getIndexFromCoords(sRow, col);
	var SW = this.getIndexFromCoords(sRow, wCol);
	var W = this.getIndexFromCoords(row, wCol);
	var NW = this.getIndexFromCoords(nRow, wCol);
	return [N, NE, E, SE, S, SW, W, NW];
}

// utility function
RLDL.prototype.getIndexFromCoords = function(row, col) {
	return (row * this.cols) + col;
}

// utility function
RLDL.prototype.getRandomTile = function() {
	var i = 0;
	do { i = RL.getRandom(0, this.tiles.length - 1); }
	while (this.tiles[i].isWall() || this.tiles[i].isOccupied());
	return this.tiles[i];
}

// Move the Field of View (FOV) as the player moves.
// Just update the new tiles. Mark the old tiles as seen.
RLDL.prototype.swapFOV = function(fromFOV, toFOV) {
	fromFOV.forEach(function(tile) {
		if (!toFOV.includes(tile)) {
			tile.status &= ~gVars.wall.FOV;
			tile.dijkstraMaps.attack = gVars.wall.DIJKSTRA_SEED;
		}
	})
	toFOV.forEach(function(tile) {
		if (!fromFOV.includes(tile)) {
			tile.status |= gVars.wall.FOV;
			if (!tile.isWall()) {
				tile.status |= gVars.wall.SEEN;
			}
		}
		tile.dijkstraMaps.attack = gVars.wall.DIJKSTRA_SEED;
	})
}

// utility function - dead monster
RLDL.prototype.removeMonster = function(monster) {
	var index = this.monsters.indexOf(monster);
	this.monsters.splice(index, 1);
}

RLD.Location = function(name) {
	this.name = name || "";
	this.occupants = [];
}

// utility functions
RLD.Location.prototype.canAdd = function() { return !this.isOccupied(); }

RLD.Location.prototype.isOccupied = function() { return this.occupants.length > 0; }

RLD.Location.prototype.getOccupants = function() { return this.occupants; }

RLD.Location.prototype.getPrimaryOccupant = function() {
	return this.occupants[0];
}

// any player, monster, or item can be an occupant
RLD.Location.prototype.addOccupant = function(occupant) {
	this.occupants.push(occupant);
}

RLD.Location.prototype.removeOccupant = function(occupant) {
	var index = this.occupants.indexOf(occupant);
	this.occupants.splice(index, 1);
}

// The Tile object.
// Status is used to seed the random wall generator
RLDL.Tile = function(row, col, level) {
	RLD.Location.call(this);
	this.row = row;
	this.col = col;
	this.level = level;
	this.dijkstraMaps = {
		wander: gVars.wall.DIJKSTRA_SEED,
		attack: gVars.wall.DIJKSTRA_SEED,
		move: gVars.wall.DIJKSTRA_SEED
	}
	this.neighbours = [];
	this.dijkstraNeighbours = [];
};
RLDL.Tile.prototype = Object.create(RLD.Location.prototype);
RLDL.Tile.prototype.constructor = RLD.Tile;

// utility functions
RLDL.Tile.prototype.isWall = function() { return this.status & gVars.wall.WALL; }
RLDL.Tile.prototype.isSeen = function() { return this.status & gVars.wall.SEEN; }
RLDL.Tile.prototype.isFOV = function() { return this.status & gVars.wall.FOV; }

RLDL.Tile.prototype.getItemsBelowPlayer = function() {
	if (this.occupants.length == 1)  return [];
	if (this.locked) {
		RLD.setMessage("The " + this.name + " is locked. You need a key.", gVars.message.GAME);
		return [];
	}
	return this.occupants.filter(function(occupant) {
		return occupant instanceof RLDA.Item;
	})
}

RLDL.Tile.prototype.getItems = function() {
	if (!this.isItem()) return [];
	return this.occupants;
}

RLDL.Tile.prototype.isPlayer = function() {
	return this.isOccupied() && this.getPrimaryOccupant() instanceof RLDA.Player;
}

RLDL.Tile.prototype.isMonster = function() {
	return this.isOccupied() && this.getPrimaryOccupant() instanceof RLDA.Monster;
}

RLDL.Tile.prototype.isItem = function() {
	return this.isOccupied() && this.getPrimaryOccupant() instanceof RLDA.Item;
}

// player and monster must be at occupant[0]
// items can fall anywhere after that
RLDL.Tile.prototype.addOccupant = function(occupant) {
	if (occupant instanceof RLDA.Item) {
		this.occupants.push(occupant);
	} else {
		this.occupants.unshift(occupant);
	}
}

RLDL.Tile.prototype.getDistance = function(tile) {
	return Math.sqrt(Math.pow(this.col - tile.col, 2) + Math.pow(this.row - tile.row, 2));
}

// check for ability to move in a certain direction
RLDL.Tile.prototype.canGo = function(direction) {
	if (this.neighbours[direction].isWall()) return false;
	var rows = this.level.rows;
	var cols = this.level.cols;
	switch (direction) {
		case gVars.dir.N:
			if (this.row == 0) return false; break;
		case gVars.dir.NE:
			if (this.row == 0 || this.col == cols - 1) return false; break;
		case gVars.dir.E:
			if (this.col == cols - 1) return false; break;
		case gVars.dir.SE:
			if (this.row == rows - 1 || this.col == cols - 1) return false; break;
		case gVars.dir.S:
			if (this.row == rows - 1) return false; break;
		case gVars.dir.SW:
			if (this.row == rows - 1 || this.col == 0) return false; break;
		case gVars.dir.W:
			if (this.col == 0) return false; break;
		case gVars.dir.NW:
			if (this.row == 0 || this.col == 0) return false; break;
	}
	return this.neighbours[direction];
}

RLDL.Tile.prototype.getFOV = function() {
	var fov = [];
	this.setFOV(0, fov);
	return fov;
}

RLDL.Tile.prototype.setFOV = function(counter, fov) {
	if (counter == 7) {
		// cannot filter out the walls, because it interferes with the
		// mining
//		this.fov = fov;
		return;
	}
	var level = this.level;
	var tiles = level.tiles;
	var radius;
	if (counter == 0 || counter == 1) radius = 6;
	if (counter == 2 || counter == 3) radius = 5;
	if (counter == 4) radius = 4;
	if (counter == 5) radius = 3;
	if (counter == 6) radius = 1;
	var i = counter;
	for (var iter = 0; iter < 2; iter++) {
		if (this.row + i >= 0 && this.row + i <= level.rows - 1) {
			fov.push(tiles[level.getIndexFromCoords(this.row + i, this.col)]);
			for (var j = 1; j <= radius; j++) {
				if (this.col + j <= level.cols - 1) {
					fov.push(tiles[level.getIndexFromCoords(this.row + i, this.col + j)]);
				}
				if (this.col - j >= 0) {
					fov.push(tiles[level.getIndexFromCoords(this.row + i, this.col - j)]);
				}
			}
		}
		if (i == 0) break;
		i *= -1;
	}
	this.setFOV(++counter, fov);
}

RLDL.Tile.prototype.getVisibleMonsters = function() {
	var fov = this.getFOV();
	var length = fov.length;
	var monsters = [];
	for (var i = 0; i < length; i++) {
		var primaryOccupant = fov[i].getPrimaryOccupant();
		if (primaryOccupant instanceof RLDA.Monster) {
			monsters.push(primaryOccupant);
		}
	}
	return monsters;
}

// utility function
RLDL.Tile.prototype.getMinDijkstra = function(map) {
	return Math.min.apply(null, this.dijkstraNeighbours.map(function(tile) {
		return tile.dijkstraMaps[map];
	}));
}

