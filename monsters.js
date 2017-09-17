gVars.monster = {}
gVars.monster.ANIMAL = 1;
gVars.monster.SMART = 2;
gVars.monster.FLEE = 0.2;

RLDA.Monster = function() {
	RLD.Actor.call(this);
	this.homeTile = "";
	this.wanderTo = 0;
	this.flags = 0;
	this.hpMod = 0;
}
RLDA.Monster.prototype = Object.create(RLD.Actor.prototype);
RLDA.Monster.prototype.constructor = RLDA.Monster;
RLDA.Monster.prototype.speed = 1;

RLDA.Monster.prototype.onHit = function() {
	return "";
};

RLDA.Monster.prototype.init = function(level, tile) {
	level.monsters.push(this);
	this.move(tile);
	this.homeTile = tile;
	if (this.friends) {
		for (var i = 0; i < this.friends; i++) {
			if (this.createFriend(level)) {
				this.wander();
			}
		}
	}
}

RLDA.Monster.prototype.createFriend = function(level) {
	var neighbours = this.location.dijkstraNeighbours;
	for (var i = 0; i < neighbours.length; i++) {
		if (!neighbours[i].isMonster()) {
			var monster = new this.constructor(true);
			monster.init(level, neighbours[i])
			return monster;
		}
	}
	return false;
}

RLDA.Monster.prototype.AIAction = function(player) {
	this.onAI(player);
}

RLDA.Monster.prototype.onAI = function(player) {
	if (this.location.dijkstraMaps.attack != gVars.wall.DIJKSTRA_SEED) {
		if (!this.willRetreat()) {
			if (this.catchPlayer()) {
				this.hitAction(player);
				if (player.isDead()) {
					RLD.eogMessage = "You were killed by " + this.getPronoun();
				}
			}
		}
		return;
	}
	this.multiply();
	if (RLD.turn % this.speed == 0) {
		this.wander();
	}
}

RLDA.Monster.prototype.multiply = function() {
	if (this.gender === "M" || !this.breeding) return;
	if (RL.getRandom(1, 200) <= this.breeding.chance) {
		// TODO - need to do random number of births
		if (this.createFriend(RLD.level)) {
			this.wander();
		}
	}
}

RLDA.Monster.prototype.wander = function() {
	if (!this.range) return;
	if (!this.wanderTo) {
		var w = this.homeTile.dijkstraMaps.wander;
		this.wanderTo = RL.getRandom(w - this.range, w + this.range);
	}
	var goTo = this.goTo("wander", this.wanderTo);
	if (!goTo) this.wanderTo = 0;
}

RLDA.Monster.prototype.goTo = function(map, number) {
	var neighbours = this.location.dijkstraNeighbours;
	var suitable = neighbours.filter(function(neighbour) {
		var check1 = !neighbour.isMonster() && !neighbour.isPlayer();
		var check2 = this.homeTile.getDistance(neighbour) < this.range;
		var td = this.location.dijkstraMaps[map];
		var nd = neighbour.dijkstraMaps[map];
		var check3 = ((td < number) ? nd > td : nd < td);
		return check1 && check2 && check3;
	}.bind(this));
	if (suitable.length > 0) {
		this.move(suitable[RL.getRandom(0, suitable.length - 1)]);
	} else {
		return false;
	}
	if (this.location.dijkstraMaps[map] == number) {
		return false;
	}
	return true;
}

RLDA.Monster.prototype.catchPlayer = function() {
	if (RLD.turn % this.speed == 0) {
		if (this.location.dijkstraMaps.attack == 1) {
			return true;
		}
		this.goTo("attack", 0);
	}
	return false;
}

RLDA.Monster.prototype.willRetreat = function() {
	var willFlee = (RL.getRandom(1, 100) < 50) && (this.getHP() < (this.hp * gVars.monster.FLEE));
	var retreat = (this.flags & gVars.monster.SMART) && (willFlee);
	if (retreat) {
		this.goTo("attack", 2);
	}
	return retreat;
}

RLDA.Monster.prototype.heal = function() {
	if (this.flags & gVars.monster.SMART) {
		this.restoreHP(1);
	}
}

// Actual stuff to be done when the monster is killed.
// Drop all items, and remove from location.
RLDA.Monster.prototype.die = function() {
	RLD.player.xp++;
	this.inventory.occupants.forEach(function(item) {
		// TODO why do i have to do like this!?! item.move() not working properly!!
		// Yet it seems to work fine for everything else !!! grrrrrrr
//		item.move(this.location);
		this.location.occupants.push(item);
		item.location = this.location;
	}.bind(this))
	this.purse.occupants.forEach(function(item) {
		this.location.occupants.push(item);
		item.location = this.location;
	}.bind(this))
	this.location.removeOccupant(this);
	this.location.level.removeMonster(this);
}

// Player takes damage if hit
RLDA.Monster.prototype.hitAction = function(player) {
	if (RL.getRandom(0, gVars.dice.TO_HIT) < player.getAC()) {
		RLD.setMessage(this.getPronoun(true) + " misses you", gVars.message.MONSTER);
		return;
	}
	var damage = 0;
	var desc = this.getCombatDesc() + " [-";
	var length = this.damage.length;
	for (var i = 0; i < length; i++) {
		var d = this.damage[i]();
		desc += d + ((i == length - 1) ? "" : ", -");
		damage += d; 
	}
	player.hpMod += damage;
	RLD.setMessage(desc += "]", gVars.message.MONSTER);
	this.onHit(player);
}

// Standard combat description
RLDA.Monster.prototype.getCombatDesc = function() {
	return "The " + this.name + " hits you";
}

// Monster bases go here

RLDA.Monster.Mould = function() {
	RLDA.Monster.call(this);
	this.gender = RL.getRandom(1, 100) <= 50 ? "F" : "M";
}
RLDA.Monster.Mould.prototype = Object.create(RLDA.Monster.prototype);
RLDA.Monster.Mould.prototype.constructor = RLDA.Monster.Mould;
RLDA.Monster.Mould.prototype.breeding = {chance: 1, min: 1, max: 1};
RLDA.Monster.Mould.prototype.getCombatDesc = function() {
	return "The " + this.name + " releases spores that damage you";
}

RLDA.Monster.Centipede = function() {
	RLDA.Monster.call(this);
}
RLDA.Monster.Centipede.prototype = Object.create(RLDA.Monster.prototype);
RLDA.Monster.Centipede.prototype.constructor = RLDA.Monster.Centipede;
RLDA.Monster.Centipede.prototype.range = 10;
RLDA.Monster.Centipede.prototype.getCombatDesc = function() {
	return "The " + this.name + " attacks you with a bite and a sting";
}

RLDA.Monster.Rodent = function() {
	RLDA.Monster.call(this);
	this.gender = RL.getRandom(1, 100) <= 50 ? "F" : "M";
	this.flags |= gVars.monster.ANIMAL;
}
RLDA.Monster.Rodent.prototype = Object.create(RLDA.Monster.prototype);
RLDA.Monster.Rodent.prototype.constructor = RLDA.Monster.Rodent;
RLDA.Monster.Rodent.prototype.range = 10;
RLDA.Monster.Rodent.prototype.breeding = {chance: 1, min: 1, max: 2};
RLDA.Monster.Rodent.prototype.getCombatDesc = function() {
	return "The " + this.name + " hurts you with a bite"
}

RLDA.Monster.Snake = function() {
	RLDA.Monster.call(this);
	this.flags |= gVars.monster.ANIMAL;
}
RLDA.Monster.Snake.prototype = Object.create(RLDA.Monster.prototype);
RLDA.Monster.Snake.prototype.constructor = RLDA.Monster.Snake;
RLDA.Monster.Snake.prototype.range = 10;
RLDA.Monster.Snake.prototype.getCombatDesc = function() {
	return "The " + this.name + " hurts with bite and crush"
}

RLDA.Monster.Kobold = function() {
	RLDA.Monster.call(this);
	this.flags |= gVars.monster.SMART;
}
RLDA.Monster.Kobold.prototype = Object.create(RLDA.Monster.prototype);
RLDA.Monster.Kobold.prototype.constructor = RLDA.Monster.Kobold;
RLDA.Monster.Kobold.prototype.range = 15;
RLDA.Monster.Kobold.prototype.getCombatDesc = function() {
	return "The " + this.name + " hits very hard"
}

RLDA.Monster.Ant = function() {
	RLDA.Monster.call(this);
	this.flags |= gVars.monster.ANIMAL;
}
RLDA.Monster.Ant.prototype = Object.create(RLDA.Monster.prototype);
RLDA.Monster.Ant.prototype.constructor = RLDA.Monster.Ant;
RLDA.Monster.Ant.prototype.range = 10;
RLDA.Monster.Ant.prototype.getCombatDesc = function() {
	return "The " + this.name + " bites with powerful mandibles"
}

RLDA.Monster.Canine = function() {
	RLDA.Monster.call(this);
	this.flags |= gVars.monster.ANIMAL;
}
RLDA.Monster.Canine.prototype = Object.create(RLDA.Monster.prototype);
RLDA.Monster.Canine.prototype.constructor = RLDA.Monster.Canine;
RLDA.Monster.Canine.prototype.range = 15;
RLDA.Monster.Canine.prototype.getCombatDesc = function() {
	return "The " + this.name + " bites you"
}

RLDA.Monster.Person = function() {
	RLDA.Monster.call(this);
	this.flags |= gVars.monster.SMART;
}
RLDA.Monster.Person.prototype = Object.create(RLDA.Monster.prototype);
RLDA.Monster.Person.prototype.constructor = RLDA.Monster.Person;
RLDA.Monster.Person.prototype.range = 25;

RLDA.Monster.Spider = function() {
	RLDA.Monster.call(this);
	this.flags |= gVars.monster.ANIMAL;
}
RLDA.Monster.Spider.prototype = Object.create(RLDA.Monster.prototype);
RLDA.Monster.Spider.prototype.constructor = RLDA.Monster.Spider;
RLDA.Monster.Spider.prototype.range = 15;
RLDA.Monster.Spider.prototype.getCombatDesc = function() {
	return "The " + this.name + " bites and stings"
}

RLDA.Monster.Ghost = function() {
	RLDA.Monster.call(this);
	this.flags |= gVars.monster.SMART;
}
RLDA.Monster.Ghost.prototype = Object.create(RLDA.Monster.prototype);
RLDA.Monster.Ghost.prototype.constructor = RLDA.Monster.Ghost;
RLDA.Monster.Ghost.prototype.range = 25;
RLDA.Monster.Ghost.prototype.speed = 2;
RLDA.Monster.Ghost.prototype.getCombatDesc = function() {
	return "The " + this.name + " has a cold and evil touch"
}
RLDA.Monster.Ghost.prototype.onHit = function(player) {
	player.dex -= 1;
	RLD.setMessage("The " + this.getPronoun() + " drains your dexterity 1 point!");
}

RLDA.Monster.Orc = function() {
	RLDA.Monster.call(this);
}
RLDA.Monster.Orc.prototype = Object.create(RLDA.Monster.prototype);
RLDA.Monster.Orc.prototype.constructor = RLDA.Monster.Orc;
RLDA.Monster.Orc.prototype.range = 20;
RLDA.Monster.Orc.prototype.speed = 2;
RLDA.Monster.Orc.prototype.getCombatDesc = function() {
	return "The " + this.name + " hits with weapon and fist"
}

RLDA.Monster.Zombie = function() {
	RLDA.Monster.call(this);
}
RLDA.Monster.Zombie.prototype = Object.create(RLDA.Monster.prototype);
RLDA.Monster.Zombie.prototype.constructor = RLDA.Monster.Zombie;
RLDA.Monster.Zombie.prototype.range = 25;
RLDA.Monster.Zombie.prototype.speed = 2;

RLDA.Monster.AncientDragon = function() {
	RLDA.Monster.call(this);
	this.flags |= gVars.monster.SMART;
}
RLDA.Monster.AncientDragon.prototype = Object.create(RLDA.Monster.prototype);
RLDA.Monster.AncientDragon.prototype.constructor = RLDA.Monster.AncientDragon;
RLDA.Monster.AncientDragon.prototype.range = 10;
RLDA.Monster.AncientDragon.prototype.speed = 2;
RLDA.Monster.AncientDragon.prototype.getCombatDesc = function() {
	return "The " + this.name + " claws and bites"
}

RLDA.Monster.Boss = function() {
	RLDA.Monster.call(this);
	this.flags |= gVars.monster.SMART;
}
RLDA.Monster.Boss.prototype = Object.create(RLDA.Monster.prototype);
RLDA.Monster.Boss.prototype.constructor = RLDA.Monster.Boss;
RLDA.Monster.Boss.prototype.range = 5;
RLDA.Monster.Boss.prototype.getCombatDesc = function() {
	return this.name + ", strikes you"
}

// Monsters go here
// This is all DATA

RLDA.Monsters = {}
var RLDAM = RLDA.Monsters;

RLDA.Monster.getMonstersForLevel = function(level) {
	var monsters = {
		0: [],
		1: [
			{monster: RLDAM.GreyMould, amount: RL.getRandom(3, 7)},
			{monster: RLDAM.WhiteCentipede, amount: RL.getRandom(2, 5)},
			{monster: RLDAM.BlackRat, amount: RL.getRandom(2, 6)},
			{monster: RLDAM.BlackSnake, amount: RL.getRandom(2, 5)},
			{monster: RLDAM.Kobold, amount: RL.getRandom(1, 4)}
		],
		2: [
			{monster: RLDAM.GreyMould, amount: RL.getRandom(3, 7)},
			{monster: RLDAM.GreenMould, amount: RL.getRandom(3, 6)},
			{monster: RLDAM.GreyCentipede, amount: RL.getRandom(3, 5)},
			{monster: RLDAM.Wolf, amount: RL.getRandom(3, 5)},
			{monster: RLDAM.BrownSnake, amount: RL.getRandom(3, 5)},
			{monster: RLDAM.RedAnt, amount: RL.getRandom(3, 5)}
		],
		3: [
			{monster: RLDAM.GreyMould, amount: RL.getRandom(3, 7)},
			{monster: RLDAM.Tarantula, amount: RL.getRandom(4, 6)},
			{monster: RLDAM.Skeleton, amount: RL.getRandom(4, 6)},
			{monster: RLDAM.Mummy, amount: RL.getRandom(2, 4)},
			{monster: RLDAM.Ghost, amount: RL.getRandom(2, 4)}
		],
		4: [
			{monster: RLDAM.GreyMould, amount: RL.getRandom(3, 7)},
			{monster: RLDAM.Thief, amount: 1},
			{monster: RLDAM.CaveOrc, amount: RL.getRandom(3, 6)},
			{monster: RLDAM.HellHound, amount: RL.getRandom(3, 5)},
			{monster: RLDAM.Lich, amount: 1}
		],
		5: [
			{monster: RLDAM.GreyMould, amount: RL.getRandom(3, 6)}
		]
	}
	return monsters[level];
}

// Level 1

RLDAM.GreyMould = function() {
	RLDA.Monster.Mould.call(this);
}
RLDAM.GreyMould.prototype = Object.create(RLDA.Monster.Mould.prototype);
RLDAM.GreyMould.prototype.constructor = RLDAM.GreyMould;
RLDAM.GreyMould.prototype.name = "Grey Mould";
RLDAM.GreyMould.prototype.className = "grey-mould";
RLDAM.GreyMould.prototype.desc = "A small strange grey growth";
RLDAM.GreyMould.prototype.ac = 1;
RLDAM.GreyMould.prototype.hp = 1;
RLDAM.GreyMould.prototype.damage = [RL.dice(1, 1)];

RLDAM.WhiteCentipede = function() {
	RLDA.Monster.Centipede.call(this);
}
RLDAM.WhiteCentipede.prototype = Object.create(RLDA.Monster.Centipede.prototype);
RLDAM.WhiteCentipede.prototype.constructor = RLDAM.WhiteCentipede;
RLDAM.WhiteCentipede.prototype.name = "Giant White Centipede";
RLDAM.WhiteCentipede.prototype.className = "white-centipede";
RLDAM.WhiteCentipede.prototype.desc = "It is about 2 meters long and carnivorous.";
RLDAM.WhiteCentipede.prototype.ac = 1;
RLDAM.WhiteCentipede.prototype.hp = 8;
RLDAM.WhiteCentipede.prototype.damage = [RL.dice(1, 2)];

RLDAM.BlackRat = function() {
	RLDA.Monster.Rodent.call(this);
}
RLDAM.BlackRat.prototype = Object.create(RLDA.Monster.Rodent.prototype);
RLDAM.BlackRat.prototype.constructor = RLDAM.BlackRat;
RLDAM.BlackRat.prototype.name = "Giant Black Rat";
RLDAM.BlackRat.prototype.className = "black-rat";
RLDAM.BlackRat.prototype.desc = "It is about 1 meter long with large, sharp teeth.";
RLDAM.BlackRat.prototype.ac = 1;
RLDAM.BlackRat.prototype.hp = 8;
RLDAM.BlackRat.prototype.damage = [RL.dice(1, 2)];

RLDAM.BlackSnake = function() {
	RLDA.Monster.Snake.call(this);
}
RLDAM.BlackSnake.prototype = Object.create(RLDA.Monster.Snake.prototype);
RLDAM.BlackSnake.prototype.constructor = RLDAM.BlackSnake;
RLDAM.BlackSnake.prototype.name = "Large Black Snake";
RLDAM.BlackSnake.prototype.className = "black-snake";
RLDAM.BlackSnake.prototype.desc = "It is about 4 meters long.";
RLDAM.BlackSnake.prototype.ac = 1;
RLDAM.BlackSnake.prototype.hp = 8;
RLDAM.BlackSnake.prototype.damage = [RL.dice(1, 3)];

RLDAM.Kobold = function() {
	RLDA.Monster.Kobold.call(this);
}
RLDAM.Kobold.prototype = Object.create(RLDA.Monster.Kobold.prototype);
RLDAM.Kobold.prototype.constructor = RLDAM.Kobold;
RLDAM.Kobold.prototype.name = "Small Kobold";
RLDAM.Kobold.prototype.className = "kobold";
RLDAM.Kobold.prototype.desc = "It is a squat and ugly humanoid figure with a canine face.";
RLDAM.Kobold.prototype.ac = 2;
RLDAM.Kobold.prototype.hp = 8;
RLDAM.Kobold.prototype.damage = [RL.dice(1, 4)];

// Level 2

RLDAM.GreenMould = function() {
	RLDA.Monster.Mould.call(this);
}
RLDAM.GreenMould.prototype = Object.create(RLDA.Monster.Mould.prototype);
RLDAM.GreenMould.prototype.constructor = RLDAM.GreenMould;
RLDAM.GreenMould.prototype.name = "Green-ish Mould";
RLDAM.GreenMould.prototype.className = "green-mould";
RLDAM.GreenMould.prototype.desc = "A small strange green-ish growth";
RLDAM.GreenMould.prototype.ac = 2;
RLDAM.GreenMould.prototype.hp = 4;
RLDAM.GreenMould.prototype.damage = [RL.dice(1, 2)];

RLDAM.GreyCentipede = function() {
	RLDA.Monster.Centipede.call(this);
}
RLDAM.GreyCentipede.prototype = Object.create(RLDA.Monster.Centipede.prototype);
RLDAM.GreyCentipede.prototype.constructor = RLDAM.GreyCentipede;
RLDAM.GreyCentipede.prototype.name = "Giant Grey Centipede";
RLDAM.GreyCentipede.prototype.className = "grey-centipede";
RLDAM.GreyCentipede.prototype.desc = "It is about 2 meters long and carnivorous.";
RLDAM.GreyCentipede.prototype.ac = 2;
RLDAM.GreyCentipede.prototype.hp = 15;
RLDAM.GreyCentipede.prototype.damage = [RL.dice(1, 3)];

RLDAM.Wolf = function(noMoreFriends) {
	RLDA.Monster.Canine.call(this);
	this.friends = noMoreFriends ? false : RL.getRandom(2, 4);
}
RLDAM.Wolf.prototype = Object.create(RLDA.Monster.Canine.prototype);
RLDAM.Wolf.prototype.constructor = RLDAM.Wolf;
RLDAM.Wolf.prototype.name = "Wolf";
RLDAM.Wolf.prototype.className = "wolf";
RLDAM.Wolf.prototype.desc = "It is a yapping, snarling wolf, dangerous in a pack.";
RLDAM.Wolf.prototype.ac = 2;
RLDAM.Wolf.prototype.hp = 8;
RLDAM.Wolf.prototype.damage = [RL.dice(1, 2)];

RLDAM.BrownSnake = function() {
	RLDA.Monster.Snake.call(this);
}
RLDAM.BrownSnake.prototype = Object.create(RLDA.Monster.Snake.prototype);
RLDAM.BrownSnake.prototype.constructor = RLDAM.BrownSnake;
RLDAM.BrownSnake.prototype.name = "Large Brown Snake";
RLDAM.BrownSnake.prototype.className = "brown-snake";
RLDAM.BrownSnake.prototype.desc = "It is about 4 meters long.";
RLDAM.BrownSnake.prototype.ac = 2;
RLDAM.BrownSnake.prototype.hp = 15;
RLDAM.BrownSnake.prototype.damage = [RL.dice(1, 2), RL.dice(1, 2)];

RLDAM.RedAnt = function(noMoreFriends) {
	RLDA.Monster.Ant.call(this);
	this.friends = noMoreFriends ? false : RL.getRandom(2, 5);
}
RLDAM.RedAnt.prototype = Object.create(RLDA.Monster.Ant.prototype);
RLDAM.RedAnt.prototype.constructor = RLDAM.RedAnt;
RLDAM.RedAnt.prototype.name = "Giant Red Ant";
RLDAM.RedAnt.prototype.className = "red-ant";
RLDAM.RedAnt.prototype.desc = "It is about 1 meter long.";
RLDAM.RedAnt.prototype.ac = 2;
RLDAM.RedAnt.prototype.hp = 8;
RLDAM.RedAnt.prototype.damage = [RL.dice(1, 3)];

// Level 3

RLDAM.Tarantula = function() {
	RLDA.Monster.Spider.call(this);
	this.gender = RL.getRandom(1, 100) <= 25 ? "F" : "M";
}
RLDAM.Tarantula.prototype = Object.create(RLDA.Monster.Spider.prototype);
RLDAM.Tarantula.prototype.constructor = RLDAM.Tarantula;
RLDAM.Tarantula.prototype.breeding = {chance: 1, min: 1, max: 1};
RLDAM.Tarantula.prototype.name = "Giant Tarantula";
RLDAM.Tarantula.prototype.className = "tarantula";
RLDAM.Tarantula.prototype.desc = "A  Giant Hairy Spider.";
RLDAM.Tarantula.prototype.ac = 3;
RLDAM.Tarantula.prototype.hp = 28;
RLDAM.Tarantula.prototype.damage = [RL.dice(1, 2), RL.dice(1, 2)];

RLDAM.Skeleton = function() {
	RLDA.Monster.Zombie.call(this);
}
RLDAM.Skeleton.prototype = Object.create(RLDA.Monster.Zombie.prototype);
RLDAM.Skeleton.prototype.constructor = RLDAM.Skeleton;
RLDAM.Skeleton.prototype.name = "Skeleton";
RLDAM.Skeleton.prototype.className = "skeleton";
RLDAM.Skeleton.prototype.desc = "An Undead Soldier.";
RLDAM.Skeleton.prototype.ac = 3;
RLDAM.Skeleton.prototype.hp = 28;
RLDAM.Skeleton.prototype.damage = [RL.dice(2, 4)];

RLDAM.Mummy = function() {
	RLDA.Monster.Zombie.call(this);
}
RLDAM.Mummy.prototype = Object.create(RLDA.Monster.Zombie.prototype);
RLDAM.Mummy.prototype.constructor = RLDAM.Mummy;
RLDAM.Mummy.prototype.name = "Mummy";
RLDAM.Mummy.prototype.className = "mummy";
RLDAM.Mummy.prototype.desc = "A human form encased in mouldy wrappings.";
RLDAM.Mummy.prototype.ac = 3;
RLDAM.Mummy.prototype.hp = 28;
RLDAM.Mummy.prototype.damage = [RL.dice(2, 5)];

RLDAM.Ghost = function() {
	RLDA.Monster.Ghost.call(this);
}
RLDAM.Ghost.prototype = Object.create(RLDA.Monster.Ghost.prototype);
RLDAM.Ghost.prototype.constructor = RLDAM.Ghost;
RLDAM.Ghost.prototype.name = "Ghost";
RLDAM.Ghost.prototype.className = "ghost";
RLDAM.Ghost.prototype.desc = "You don't believe in it, but it believes in you.";
RLDAM.Ghost.prototype.ac = 3;
RLDAM.Ghost.prototype.hp = 28;
RLDAM.Ghost.prototype.damage = [RL.dice(1, 3), RL.dice(1, 3)];

// level 4

RLDAM.Thief = function() {
	RLDA.Monster.Person.call(this);
	new RLDAI.RingStr().move(this.inventory);
	new RLDAI.RingTulkas().move(this.inventory);
}
RLDAM.Thief.prototype = Object.create(RLDA.Monster.Person.prototype);
RLDAM.Thief.prototype.constructor = RLDAM.Thief;
RLDAM.Thief.prototype.name = "Common Thief";
RLDAM.Thief.prototype.className = "thief";
RLDAM.Thief.prototype.desc = "A shifty looking individual.";
RLDAM.Thief.prototype.ac = 4;
RLDAM.Thief.prototype.hp = 48;
RLDAM.Thief.prototype.damage = [RL.dice(2, 6)];

RLDAM.CaveOrc = function(noMoreFriends) {
	RLDA.Monster.Orc.call(this);
	this.friends = noMoreFriends ? false : RL.getRandom(3, 6);
	this.className = "orc" + RL.getRandom(0, 2);
}
RLDAM.CaveOrc.prototype = Object.create(RLDA.Monster.Orc.prototype);
RLDAM.CaveOrc.prototype.constructor = RLDAM.CaveOrc;
RLDAM.CaveOrc.prototype.name = "Cave Orc";
RLDAM.CaveOrc.prototype.desc = "Found in large numbers in deep caves.";
RLDAM.CaveOrc.prototype.ac = 4;
RLDAM.CaveOrc.prototype.hp = 38;
RLDAM.CaveOrc.prototype.damage = [RL.dice(2, 4)];

RLDAM.HellHound = function() {
	RLDA.Monster.Canine.call(this);
}
RLDAM.HellHound.prototype = Object.create(RLDA.Monster.Canine.prototype);
RLDAM.HellHound.prototype.constructor = RLDAM.HellHound;
RLDAM.HellHound.prototype.name = "Hell Hound";
RLDAM.HellHound.prototype.className = "hell-hound";
RLDAM.HellHound.prototype.desc = "A giant dog, glowing with heat.";
RLDAM.HellHound.prototype.ac = 4;
RLDAM.HellHound.prototype.hp = 48;
RLDAM.HellHound.prototype.damage = [RL.dice(1, 3), RL.dice(1, 3)];

RLDAM.Lich = function() {
	RLDA.Monster.Ghost.call(this);
}
RLDAM.Lich.prototype = Object.create(RLDA.Monster.Ghost.prototype);
RLDAM.Lich.prototype.constructor = RLDAM.Lich;
RLDAM.Lich.prototype.name = "Master Lich";
RLDAM.Lich.prototype.className = "lich";
RLDAM.Lich.prototype.desc = "An ethereal form.";
RLDAM.Lich.prototype.ac = 6;
RLDAM.Lich.prototype.hp = 48;
RLDAM.Lich.prototype.damage = [RL.dice(1, 3), RL.dice(2, 3)];

// Level 5 - the boss

RLDAM.BlackDragon = function() {
	RLDA.Monster.AncientDragon.call(this);
}
RLDAM.BlackDragon.prototype = Object.create(RLDA.Monster.AncientDragon.prototype);
RLDAM.BlackDragon.prototype.constructor = RLDAM.BlackDragon;
RLDAM.BlackDragon.prototype.name = "Ancient Black Dragon";
RLDAM.BlackDragon.prototype.className = "black-dragon";
RLDAM.BlackDragon.prototype.desc = "A huge draconic form. The most dangerous of the dragons.";
RLDAM.BlackDragon.prototype.ac = 5;
RLDAM.BlackDragon.prototype.hp = 60;
RLDAM.BlackDragon.prototype.damage = [RL.dice(2, 4), RL.dice(2, 4), RL.dice(2, 4)];

RLDAM.RedDragon = function() {
	RLDA.Monster.AncientDragon.call(this);
}
RLDAM.RedDragon.prototype = Object.create(RLDA.Monster.AncientDragon.prototype);
RLDAM.RedDragon.prototype.constructor = RLDAM.RedDragon;
RLDAM.RedDragon.prototype.name = "Ancient Red Dragon";
RLDAM.RedDragon.prototype.className = "red-dragon";
RLDAM.RedDragon.prototype.desc = "A huge draconic form.";
RLDAM.RedDragon.prototype.ac = 5;
RLDAM.RedDragon.prototype.hp = 60;
RLDAM.RedDragon.prototype.damage = [RL.dice(1, 3), RL.dice(1, 3), RL.dice(1, 3)];

RLDAM.WhiteDragon = function() {
	RLDA.Monster.AncientDragon.call(this);
}
RLDAM.WhiteDragon.prototype = Object.create(RLDA.Monster.AncientDragon.prototype);
RLDAM.WhiteDragon.prototype.constructor = RLDAM.WhiteDragon;
RLDAM.WhiteDragon.prototype.name = "Ancient White Dragon";
RLDAM.WhiteDragon.prototype.className = "white-dragon";
RLDAM.WhiteDragon.prototype.desc = "A huge draconic form.";
RLDAM.WhiteDragon.prototype.ac = 5;
RLDAM.WhiteDragon.prototype.hp = 60;
RLDAM.WhiteDragon.prototype.damage = [RL.dice(1, 3), RL.dice(1, 3), RL.dice(1, 3)];

RLDAM.GoldDragon = function() {
	RLDA.Monster.AncientDragon.call(this);
}
RLDAM.GoldDragon.prototype = Object.create(RLDA.Monster.AncientDragon.prototype);
RLDAM.GoldDragon.prototype.constructor = RLDAM.GoldDragon;
RLDAM.GoldDragon.prototype.name = "Ancient Gold Dragon";
RLDAM.GoldDragon.prototype.className = "gold-dragon";
RLDAM.GoldDragon.prototype.desc = "A huge draconic form.";
RLDAM.GoldDragon.prototype.ac = 5;
RLDAM.GoldDragon.prototype.hp = 60;
RLDAM.GoldDragon.prototype.damage = [RL.dice(2, 3), RL.dice(2, 3), RL.dice(2, 3)];

RLDAM.Morgoth = function() {
	RLDA.Monster.Boss.call(this);
	new RLDAI.MagicBook().move(this.inventory);
	new RLDAI.UnlockHouse().move(this.inventory);
}
RLDAM.Morgoth.prototype = Object.create(RLDA.Monster.Boss.prototype);
RLDAM.Morgoth.prototype.constructor = RLDAM.Morgoth;
RLDAM.Morgoth.prototype.name = "Morgoth, Lord of Darkness";
RLDAM.Morgoth.prototype.className = "morgoth";
RLDAM.Morgoth.prototype.desc = "Big description.";
RLDAM.Morgoth.prototype.ac = 7;
RLDAM.Morgoth.prototype.hp = 60;
RLDAM.Morgoth.prototype.damage = [RL.dice(2, 4), RL.dice(2, 4), RL.dice(2, 4)];
RLDAM.Morgoth.prototype.AIAction = function() {
	if (RLD.turn % 5 == 0) {
		var book = this.alreadyHas(RLDAI.MagicBook.prototype);
		if (book && book.amount) {
			var spell = new book.spells[RL.getRandom(0, book.spells.length - 1)]();
			spell.castAction(RLD.player);
			book.amount--;
		}
	}
	this.onAI(RLD.player);
}
