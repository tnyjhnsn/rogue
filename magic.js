
RLDA.Item.Magic = function() {
	RLDA.Item.Weapon.call(this);
}
RLDA.Item.Magic.prototype = Object.create(RLDA.Item.Weapon.prototype);
RLDA.Item.Magic.prototype.constructor = RLDA.Item.Magic;

RLDAI.SummonsBoss = function() {
	RLDA.Item.Magic.call(this);
	this.trade = {cost: RL.getRandom(28000, 32000), currency: RLDAI.Adamantite.prototype}
}
RLDAI.SummonsBoss.prototype = Object.create(RLDA.Item.Magic.prototype);
RLDAI.SummonsBoss.prototype.constructor = RLDAI.SummonsBoss;
RLDAI.SummonsBoss.prototype.name = "Scroll of Boss Summoning";
RLDAI.SummonsBoss.prototype.className = "scroll";
RLDAI.SummonsBoss.prototype.desc = "Use if you dare.";
RLDAI.SummonsBoss.prototype.getStats = function() {
	return "";
}
RLDAI.SummonsBoss.prototype.castAction = function() {
	if (RLD.level.lvl != 5) {
		RLD.setMessage("This scroll is only useful on level 5", gVars.message.GAME);
		return;
	}
	var boss = new RLDAM.Morgoth();
	boss.init(RLD.level, RLD.level.getRandomTile());
	RLD.summonsBoss = true;
	RLD.player.inventory.removeOccupant(this);
}

RLDAI.UnlockHouse = function() {
	RLDA.Item.Magic.call(this);
}
RLDAI.UnlockHouse.prototype = Object.create(RLDA.Item.Magic.prototype);
RLDAI.UnlockHouse.prototype.constructor = RLDAI.UnlockHouse;
RLDAI.UnlockHouse.prototype.name = "Scroll of Unlock Haunted House";
RLDAI.UnlockHouse.prototype.className = "scroll-unlock";
RLDAI.UnlockHouse.prototype.desc = "A key to unlock a Haunted House";
RLDAI.UnlockHouse.prototype.getStats = function() {
	return "";
}
RLDAI.UnlockHouse.prototype.castAction = function() {
	if (!(RLD.player.location.occupants[1] instanceof RLDA.HauntedHouse)) {
		RLD.setMessage("There is no Haunted House at this location", gVars.message.GAME);
		return;
	}
	RLD.setMessage("The Haunted House is unlocked", gVars.message.GAME);
	RLD.player.location.locked = false;
	RLD.player.inventory.removeOccupant(this);
}

RLDAI.UnlockChest = function() {
	RLDA.Item.Magic.call(this);
}
RLDAI.UnlockChest.prototype = Object.create(RLDA.Item.Magic.prototype);
RLDAI.UnlockChest.prototype.constructor = RLDAI.UnlockChest;
RLDAI.UnlockChest.prototype.name = "Scroll of Unlock Treasure Chest";
RLDAI.UnlockChest.prototype.className = "scroll-unlock";
RLDAI.UnlockChest.prototype.desc = "A key to unlock a Treasure Chest";
RLDAI.UnlockChest.prototype.getStats = function() {
	return "";
}
RLDAI.UnlockChest.prototype.castAction = function() {
	if (!(RLD.player.location.occupants[1] instanceof RLDA.TreasureChest)) {
		RLD.setMessage("There is no Treasure Chest at this location", gVars.message.GAME);
		return;
	}
	RLD.setMessage("The Treasure Chest is unlocked", gVars.message.GAME);
	RLD.player.location.locked = false;
	RLD.player.inventory.removeOccupant(this);
}

RLDAI.Congratulations = function() {
	RLDA.Item.Magic.call(this);
}
RLDAI.Congratulations.prototype = Object.create(RLDA.Item.Magic.prototype);
RLDAI.Congratulations.prototype.constructor = RLDAI.Congratulations;
RLDAI.Congratulations.prototype.name = "Letter of Congratulations";
RLDAI.Congratulations.prototype.className = "scroll";
RLDAI.Congratulations.prototype.desc = "Congratulations & Thanks";
RLDAI.Congratulations.prototype.getStats = function() {
	return "";
}
RLDAI.Congratulations.prototype.castAction = function() {
	RLD.congratulations = true;
}

RLDAI.MagicMissiles = function() {
	RLDA.Item.Magic.call(this);
}
RLDAI.MagicMissiles.prototype = Object.create(RLDA.Item.Magic.prototype);
RLDAI.MagicMissiles.prototype.constructor = RLDAI.MagicMissiles;
RLDAI.MagicMissiles.prototype.name = "Magic Missiles";
RLDAI.MagicMissiles.prototype.className = "magic-missiles";
RLDAI.MagicMissiles.prototype.desc = "Description needed.";
RLDAI.MagicMissiles.prototype.dmin = 3;
RLDAI.MagicMissiles.prototype.dmax = 12;
RLDAI.MagicMissiles.prototype.castAction = function(actor) {
	RLD.setMessage("Morgoth waves his hand to cast a spell...", gVars.message.MONSTER);
	this.hitAction(actor);
}

RLDAI.SummonsDragon = function() {
	RLDA.Item.Magic.call(this);
}
RLDAI.SummonsDragon.prototype = Object.create(RLDA.Item.Magic.prototype);
RLDAI.SummonsDragon.prototype.constructor = RLDAI.SummonsDragon;
RLDAI.SummonsDragon.prototype.name = "Summons Dragons";
RLDAI.SummonsDragon.prototype.className = "summons-dragons";
RLDAI.SummonsDragon.prototype.desc = "Description needed.";
RLDAI.SummonsDragon.prototype.castAction = function(actor) {
	var dragons = [
		RLDAM.BlackDragon,
		RLDAM.RedDragon,
		RLDAM.WhiteDragon,
		RLDAM.GoldDragon
	]
	RLD.setMessage("Morgoth waves his hand to cast a spell...", gVars.message.MONSTER);
	var selectedDragon = new dragons[RL.getRandom(0, dragons.length - 1)]();
	selectedDragon.init(RLD.level, RLD.level.getRandomTile());
	RLD.setMessage("An " + selectedDragon.name + " has been spawned in the chamber", gVars.message.MONSTER);
}

RLDAI.MagicBook = function() {
	RLDA.Item.Magic.call(this);
	this.amount = RL.getRandom(6, 9);
}
RLDAI.MagicBook.prototype = Object.create(RLDA.Item.Magic.prototype);
RLDAI.MagicBook.prototype.constructor = RLDAI.MagicBook;
RLDAI.MagicBook.prototype.name = "Magic Book";
RLDAI.MagicBook.prototype.className = "magic-book";
RLDAI.MagicBook.prototype.desc = "Description needed.";
RLDAI.MagicBook.prototype.spells = [RLDAI.MagicMissiles, RLDAI.SummonsDragon];
RLDAI.MagicBook.prototype.castAction = function() {
	RLD.setMessage("You don't have the ability to cast spells from a spellbook (yet!)");
}

