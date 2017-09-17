gVars.player = {}
gVars.player.INV_LIMIT = 6;

// The main Actor object
// This is subclassed by: Player, Monster, Item

RLD.Actor = function() {
	this.location = false;
	this.inventory = new RLD.Location();
	this.purse = new RLD.Location();
	this.cssStyle = {};
}

var RLDA = RLD.Actor;

RLDA.prototype.getClassName = function() {
	return this.className;
}

// Move the actor from location to location
RLDA.prototype.move = function(newLocation) {
	if (this.location) this.location.removeOccupant(this);
	newLocation.addOccupant(this);
	this.location = newLocation;
}

// Basic word creation for messages
RLDA.prototype.getPronoun = function(initialCap) {
	var pronoun = "the " + this.name;
	return initialCap ? pronoun[0].toUpperCase() + pronoun.slice(1) : pronoun;
}

RLDA.prototype.getChipDescription = function() {
	return this.name;
}

RLDA.prototype.getHP = function() {
	return this.hp - this.hpMod;
}

RLDA.prototype.restoreHP = function(amount) {
	this.hpMod -= amount;
	if (this.hpMod < 0) {
		this.hpMod = 0;
	}
}

RLDA.prototype.getStats = function() {
	return "";
}

RLDA.prototype.alreadyHas = function(prototype) {
	var inventory = this.inventory;
	var length = this.inventory.occupants.length;
	for (var i = 0; i < length; i++) {
		var o = inventory.occupants[i];
		if (Object.getPrototypeOf(o) === prototype) {
			return o;
		}
	}
	var purse = this.purse;
	var length = this.purse.occupants.length;
	for (var i = 0; i < length; i++) {
		var o = purse.occupants[i];
		if (Object.getPrototypeOf(o) === prototype) {
			return o;
		}
	}
	for (var key in this.body) {
		if (this.body[key].isOccupied()) {
			var o = this.body[key].getPrimaryOccupant();
			if (Object.getPrototypeOf(o) === prototype) {
				return o;
			}
		}
	}
	return false;
}

RLDA.prototype.isDead = function() {
	return (this.hp - this.hpMod) <= 0;
}

// The main player object
// There is only 1 needed
// All the body parts and quiver are just locations that items can be moved
// to and from
RLDA.Player = function() {
	RLDA.call(this);
	this.name = "Player";
	this.className = "player";
	this.desc = "It's you!";
	this.pClass = "";
	this.xp = 0;
	this.level = 1;
	this.hp = 30;
	this.hpMod = 0;
	this.body = {
		weapon: new RLD.Location("weapon"),
		bow: new RLD.Location("bow"),
		quiver: new RLD.Location("quiver"),
		ringL: new RLD.Location("left ring"),
		ringR: new RLD.Location("right ring"),
		amulet: new RLD.Location("amulet"),
		armour: new RLD.Location("armour"),
		shield: new RLD.Location("shield")
	};
	this.str= 16;
	this.dex = 16;
	this.cssStyle.borderRadius = "50%";
	this.cssStyle.backgroundColor = "#fcb94d";
	this.init();
}
RLDA.Player.prototype = Object.create(RLDA.prototype);
RLDA.Player.prototype.constructor = RLDA.Player;

// utility functions

RLDA.Player.prototype.init = function() {
	new RLDAI.AmuletMother().move(this.body.amulet);
	new RLDAI.Adamantite().move(this.purse);
	new RLDAI.Gold().move(this.purse);
	this.inventory.canAdd = function() {
		return this.inventory.occupants.length < gVars.player.INV_LIMIT;
	}.bind(this)
}

RLDA.Player.prototype.getClassName = function() {
	return this.className + "-" + this.gender;
}

RLDA.Player.prototype.getAC = function() {
	var ac = 0;
	for (var key in this.body) {
		if (this.body[key].isOccupied()) {
			var o = this.body[key].getPrimaryOccupant();
			if (o instanceof RLDA.Item.Armour) {
				ac += o.ac;
			}
		}
	}
	return ac;
}

RLDA.Player.prototype.heal = function() {
	this.restoreHP(2);
}

RLDA.Player.prototype.getPronoun = function(initialCap) {
	var pronoun = "you";
	return initialCap ? pronoun[0].toUpperCase() + pronoun.slice(1) : pronoun;
}

// RACE stuff
// This is easy to expand into multiple races and classes
RLDA.PlayerRace = {}

RLDA.PlayerRace.Human = function() {
	RLDA.Player.call(this);
	this.type = "Human";
	this.gender = "m";
	this.hpl = 20;
}
RLDA.PlayerRace.Human.prototype = Object.create(RLDA.Player.prototype);


// Class stuff
RLDA.PlayerClass = {}

RLDA.PlayerClass.Fighter = function() {
	this.type = "Fighter";
}

// Town buildings

RLDA.Shop = function() {
	RLDA.call(this);
	this.name = "The Dwarven Trader";
	this.className = "shop";
	this.desc = "Purveyors of Fine Adventuring Accessories";
}
RLDA.Shop.prototype = Object.create(RLDA.prototype);
RLDA.Shop.prototype.constructor = RLDA.Shop;

RLDA.House = function() {
	RLDA.call(this);
	this.name = "Home";
	this.className = "house";
	this.desc = "Home, sweet home... You live here";
}
RLDA.House.prototype = Object.create(RLDA.prototype);
RLDA.House.prototype.constructor = RLDA.House;

RLDA.Library = function() {
	RLDA.call(this);
	this.name = "Library";
	this.className = "library";
	this.desc = "The Great Library of Thebes";
}
RLDA.Library.prototype = Object.create(RLDA.prototype);
RLDA.Library.prototype.constructor = RLDA.Library;

RLDA.HauntedHouse = function() {
	RLDA.call(this);
	this.name = "Haunted House";
	this.className = "haunted-house";
	this.desc = "You will need a key to unlock the Haunted House. Nobody knows for sure what is in there.";
}
RLDA.HauntedHouse.prototype = Object.create(RLDA.prototype);
RLDA.HauntedHouse.prototype.constructor = RLDA.HauntedHouse;

RLDA.TreasureChest = function() {
	RLDA.call(this);
	this.name = "Treasure Chest";
	this.className = "treasure-chest";
	this.desc = "You will need a key to unlock the Treasure Chest.";
}
RLDA.TreasureChest.prototype = Object.create(RLDA.prototype);
RLDA.TreasureChest.prototype.constructor = RLDA.TreasureChest;

RLDA.Inn = function() {
	RLDA.call(this);
	this.name = "Fat Dragon Inn";
	this.className = "inn";
	this.desc = "The locals' favourite";
}
RLDA.Inn.prototype = Object.create(RLDA.prototype);
RLDA.Inn.prototype.constructor = RLDA.Inn;

RLDA.Morgaine = function() {
	RLDA.call(this);
	this.name = "Morgaine's House";
	this.className = "morgaine";
	this.desc = "They say she's a witch, with all those potions";
}
RLDA.Morgaine.prototype = Object.create(RLDA.prototype);
RLDA.Morgaine.prototype.constructor = RLDA.Morgaine;

RLDA.StairsDown = function() {
	RLDA.call(this);
	this.name = "Stairs Down";
	this.className = "stairs-down";
	this.desc = "Stairs leading down into the gloom of the next level. Use < to activate.";
}
RLDA.StairsDown.prototype = Object.create(RLDA.prototype);
RLDA.StairsDown.prototype.constructor = RLDA.StairsDown;

RLDA.StairsUp = function() {
	RLDA.call(this);
	this.name = "Stairs Up";
	this.className = "stairs-up";
	this.desc = "Stairs leading up into the gloom of the next level. Use > to activate.";
}
RLDA.StairsUp.prototype = Object.create(RLDA.prototype);
RLDA.StairsUp.prototype.constructor = RLDA.StairsUp;
