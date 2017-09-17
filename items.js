gVars.item = {}
gVars.item.MAX_ATTRIBUTE = 20;

// Item Object
// items are anything that isn't a monster or player
// RLDA is a subclass of Actor (see player.js)

RLDA.Item = function() {
	RLD.Actor.call(this);
	this.flags = 0;
}
RLDA.Item.prototype = Object.create(RLD.Actor.prototype);
RLDA.Item.prototype.constructor = RLDA.Item;

RLDA.Item.cssStyle = {
	borderRadius: "50%",
	backgroundColor: "#aa6600",
}

RLDA.Item.prototype.getChipDescription = function() {
	var desc = "";
	if (this.hasOwnProperty("amount")) {
		desc = " [" + this.amount + "]";
	}
	if (this.hasOwnProperty("trade")) {
		if (this.trade.cost > 0) {
			desc += " (Costs " + this.trade.cost + " " + this.trade.currency.name + ")";
		}
	}
	return this.name + desc;
}

RLDA.Item.prototype.wieldAction = function(player) {
	this.onWield(player);
}

RLDA.Item.prototype.takeAction = function(actor) {
	this.onTake(actor);
}

RLDA.Item.prototype.onTake = function(actor) {
	if (this.hasOwnProperty("amount")) {
		var alreadyHas = actor.alreadyHas(Object.getPrototypeOf(this));
		if (alreadyHas) {
			alreadyHas.amount += this.amount;
			this.location.removeOccupant(this);
			RLD.setMessage(this.amount + " " + this.name + " added", gVars.message.PLAYER);
			return;
		}
	}
	if (!(this instanceof RLDA.Item.Gold)) {
		if (!RLD.player.inventory.canAdd()) {
			RLD.setMessage("Your backpack cannot hold any more than " + gVars.player.INV_LIMIT + " items", gVars.message.GAME);
			return;
		}
	}
	if (this.hasOwnProperty("trade")) {
		if (!this.onTrade(actor)) return;
	}
	if (this instanceof RLDA.Item.Gold) {
		this.move(actor.purse);
	} else {
		this.move(actor.inventory);
	}
	RLD.setMessage(actor.getPronoun(true) + " take "  + this.getPronoun(), gVars.message.PLAYER);
}

RLDA.Item.prototype.onTrade = function(player) {
	var currency = player.alreadyHas(this.trade.currency);
	var type = this.trade.currency.name;
	if (!currency) {
		RLD.setMessage("You don't have any " + type + " to spend", gVars.message.GAME);
		return false;
	}
	if (currency.amount < this.trade.cost) {
		RLD.setMessage("You dont have enough " + type + " to buy " + this.getPronoun(), gVars.message.GAME);
		return false;
	}
	currency.amount -= this.trade.cost;
	this.trade.cost = 0;
	return true;	
}

RLDA.Item.prototype.addToBody = function(player, location) {
	if (!location.canAdd()) {
		location.getPrimaryOccupant().move(player.inventory);
	}
	this.move(location);
	RLD.setMessage("You are using "  + this.getPronoun(), gVars.message.PLAYER);
}

RLDA.Item.prototype.removeAction = function(player) {
	this.onRemove(player);
}

RLDA.Item.prototype.onRemove = function(player) {
	this.move(player.inventory);
	RLD.setMessage("You remove "  + this.getPronoun(), gVars.message.PLAYER);
}

RLDA.Item.prototype.dropAction = function(actor) {
	if (actor.location.level.lvl == 0 && actor.location != actor.house.location) {
		RLD.setMessage("When in town, you must be at your home to drop items", gVars.message.GAME);
		return;
	}
	this.move(actor.location);
	RLD.setMessage(actor.getPronoun(true) + " drop "  + this.getPronoun(), gVars.message.PLAYER);
}

// Item bases go here
// These are subclassed

RLDA.Item.Hardware = function() {
	RLDA.Item.call(this);
}
RLDA.Item.Hardware.prototype = Object.create(RLDA.Item.prototype);
RLDA.Item.Hardware.prototype.constructor = RLDA.Item.Hardware;

RLDA.Item.Food = function() {
	RLDA.Item.call(this);
}
RLDA.Item.Food.prototype = Object.create(RLDA.Item.prototype);
RLDA.Item.Food.prototype.constructor = RLDA.Item.Food;
RLDA.Item.Food.prototype.eatAction = function(actor) {
	actor.inventory.removeOccupant(this);
	RLD.setMessage(this.getPronoun(true) + " is very delicious", gVars.message.PLAYER);
}

RLDA.Item.Weapon = function() {
	RLDA.Item.call(this);
}
RLDA.Item.Weapon.prototype = Object.create(RLDA.Item.prototype);
RLDA.Item.Weapon.prototype.constructor = RLDA.Item.Weapon;
RLDA.Item.Weapon.prototype.onWield = function(player) {
	this.addToBody(player, player.body.weapon);
}
RLDA.Item.Weapon.prototype.hitAction = function(actor) {
	if (this.hasOwnProperty("amount")) {
		this.amount--;
		if (!this.amount) {
			this.location.removeOccupant(this);
		}
	}
	if (RL.getRandom(0, gVars.dice.TO_HIT) < actor.ac) {
		RLD.setMessage(this.getPronoun(true) + " missed " + actor.getPronoun(), gVars.message.GAME);
		return;
	}
	var d = this.getDamage();
	actor.hpMod += d;
	RLD.setMessage(this.getPronoun(true) + " hit " + actor.getPronoun() + " [-" + d + "]", gVars.message.PLAYER);
	if (actor.isDead()) {
		RLD.setMessage(actor.getPronoun(true) + " is dead", gVars.message.GAME);
		actor.die();
	}
}
RLDA.Item.Weapon.prototype.getDamage = function() {
	return RL.getRandom(this.dmin, this.dmax);
}
RLDA.Item.Weapon.prototype.getStats = function() {
	return "( Damage: " + this.dmin + " to " + this.dmax + " )";
}

RLDA.Item.Bow = function() {
	RLDA.Item.call(this);
}
RLDA.Item.Bow.prototype = Object.create(RLDA.Item.prototype);
RLDA.Item.Bow.prototype.constructor = RLDA.Item.Bow;
RLDA.Item.Bow.prototype.onWield = function(player) {
	this.addToBody(player, player.body.bow);
}

RLDA.Item.Arrow = function() {
	RLDA.Item.Weapon.call(this);
}
RLDA.Item.Arrow.prototype = Object.create(RLDA.Item.Weapon.prototype);
RLDA.Item.Arrow.prototype.constructor = RLDA.Item.Arrow;
RLDA.Item.Arrow.prototype.onWield = function(player) {
	this.addToBody(player, player.body.quiver);
}

RLDA.Item.Armour = function() {
	RLDA.Item.call(this);
}
RLDA.Item.Armour.prototype = Object.create(RLDA.Item.prototype);
RLDA.Item.Armour.prototype.constructor = RLDA.Item.Armour;
RLDA.Item.Armour.prototype.getStats = function() {
	return "( Armour Class: " + this.ac + " )";
}
RLDA.Item.Armour.prototype.onWield = function(player) {
	this.addToBody(player, player.body.armour);
}

RLDA.Item.Ring = function() {
	RLDA.Item.Armour.call(this);
}
RLDA.Item.Ring.prototype = Object.create(RLDA.Item.Armour.prototype);
RLDA.Item.Ring.prototype.constructor = RLDA.Item.Ring;
RLDA.Item.Ring.prototype.onWield = function(player) {
	// TODO need to sort this out a bit
	// Currently it will allow multiple ringR
	if (!player.body.ringL.canAdd()) {
		player.body.ringL.getPrimaryOccupant().addToBody(player, player.body.ringR);
	}
	this.addToBody(player, player.body.ringL);
}

RLDA.Item.Amulet = function() {
	RLDA.Item.Armour.call(this);
}
RLDA.Item.Amulet.prototype = Object.create(RLDA.Item.Armour.prototype);
RLDA.Item.Amulet.prototype.constructor = RLDA.Item.Amulet;
RLDA.Item.Amulet.prototype.onWield = function(player) {
	this.addToBody(player, player.body.amulet);
}

RLDA.Item.Shield = function() {
	RLDA.Item.Armour.call(this);
}
RLDA.Item.Shield.prototype = Object.create(RLDA.Item.Armour.prototype);
RLDA.Item.Shield.prototype.constructor = RLDA.Item.Shield;
RLDA.Item.Shield.prototype.onWield = function(player) {
	this.addToBody(player, player.body.shield);
}

RLDA.Item.Gold = function() {
	RLDA.Item.call(this);
}
RLDA.Item.Gold.prototype = Object.create(RLDA.Item.prototype);
RLDA.Item.Gold.prototype.constructor = RLDA.Item.Gold;

// Individual Items go here
// This is all DATA
// Gender info is used for monster random breeding

RLDA.Items = {}
var RLDAI = RLDA.Items;

RLDA.Item.getItemsForLevel = function(level) {
	var items = {
		0: [],
		1: [
			{item: RLDAI.RingVilya, amount: 1},
			{item: RLDAI.AmuletCarlammas, amount: 1},
			{item: RLDAI.YellowMushroom, amount: RL.getRandom(3, 6)},
			{item: RLDAI.LeatherArmour, amount: 2},
			{item: RLDAI.Dagger, amount: 2},
			{item: RLDAI.Arrows, amount: RL.getRandom(2, 4)}
		],
		2: [
			{item: RLDAI.RingNenya, amount: 1},
			{item: RLDAI.AmuletIngwe, amount: 1},
			{item: RLDAI.TrippyMushroom, amount: RL.getRandom(3, 6)},
			{item: RLDAI.YellowMushroom, amount: RL.getRandom(3, 6)},
			{item: RLDAI.ScaleMail, amount: 2},
			{item: RLDAI.ShortSword, amount: 2},
			{item: RLDAI.LongBow, amount: 2},
			{item: RLDAI.Arrows, amount: RL.getRandom(2, 4)}
		],
		3: [
			{item: RLDAI.RingBarahir, amount: 1},
			{item: RLDAI.AmuletDwarves, amount: 1},
			{item: RLDAI.PlateArmour, amount: 2},
			{item: RLDAI.LongSword, amount: 2},
			{item: RLDAI.Arrows, amount: RL.getRandom(2, 4)}
		],
		4: [
			{item: RLDAI.RingOne, amount: 1},
			{item: RLDAI.AmuletElessar, amount: 1},
			{item: RLDAI.AdamantiteArmour, amount: 2},
			{item: RLDAI.Hammer, amount: 1},
			{item: RLDAI.UnlockChest, amount: 1}
		],
		5: []
	}
	return items[level];
}

RLDAI.MouldRemover = function() {
	RLDA.Item.Hardware.call(this);
	this.trade = {cost: RL.getRandom(2, 4), currency: RLDAI.Gold.prototype}
}
RLDAI.MouldRemover.prototype = Object.create(RLDA.Item.Hardware.prototype);
RLDAI.MouldRemover.prototype.constructor = RLDAI.MouldRemover;
RLDAI.MouldRemover.prototype.name = "Supa-Tuff Mould & Scum Remover";
RLDAI.MouldRemover.prototype.className = "anti-mould";
RLDAI.MouldRemover.prototype.desc = "Bam! The mould is gone!!";
RLDAI.MouldRemover.prototype.onWield = function() {
	RLD.setMessage(this.getPronoun(true) + " is only useful for cleaning your bathroom", gVars.message.GAME);
}

RLDAI.HealthPotion = function() {
	RLDA.Item.Weapon.call(this);
	this.trade = {cost: 2, currency: RLDAI.Gold.prototype}
}
RLDAI.HealthPotion.prototype = Object.create(RLDA.Item.Weapon.prototype);
RLDAI.HealthPotion.prototype.constructor = RLDAI.HealthPotion;
RLDAI.HealthPotion.prototype.name = "Health Potion";
RLDAI.HealthPotion.prototype.className = "health-potion";
RLDAI.HealthPotion.prototype.desc = "Completely restores HP";
RLDAI.HealthPotion.prototype.onWield = function(player) {
	RLD.setMessage("You drink " + this.getPronoun(), gVars.message.PLAYER);
	player.hpMod = 0;
	player.inventory.removeOccupant(this);
	RLD.setMessage("Your HP has been restored.", gVars.message.GAME);
}
RLDAI.HealthPotion.prototype.getStats = function() {
	return "";
}

RLDAI.AcidRain = function() {
	RLDA.Item.Weapon.call(this);
	this.trade = {cost: 15, currency: RLDAI.Gold.prototype}
}
RLDAI.AcidRain.prototype = Object.create(RLDA.Item.Weapon.prototype);
RLDAI.AcidRain.prototype.constructor = RLDAI.AcidRain;
RLDAI.AcidRain.prototype.name = "Acid Rain";
RLDAI.AcidRain.prototype.className = "acid-rain";
RLDAI.AcidRain.prototype.desc = "Damages all it touches";
RLDAI.AcidRain.prototype.dmin = 3;
RLDAI.AcidRain.prototype.dmax = 6;
RLDAI.AcidRain.prototype.onWield = function(player) {
	RLD.setMessage("You cast " + this.getPronoun() + " into the air.", gVars.message.PLAYER);
	player.location.getVisibleMonsters().forEach(function(monster) {
		this.hitAction(monster);
	}.bind(this))
	player.inventory.removeOccupant(this);
}

RLDAI.DragonBreath = function() {
	RLDA.Item.Weapon.call(this);
	this.trade = {cost: 25, currency: RLDAI.Gold.prototype}
}
RLDAI.DragonBreath.prototype = Object.create(RLDA.Item.Weapon.prototype);
RLDAI.DragonBreath.prototype.constructor = RLDAI.DragonBreath;
RLDAI.DragonBreath.prototype.name = "Dragon Breath";
RLDAI.DragonBreath.prototype.className = "dragon-breath";
RLDAI.DragonBreath.prototype.desc = "Breath Fire all Around";
RLDAI.DragonBreath.prototype.dmin = 4;
RLDAI.DragonBreath.prototype.dmax = 8;
RLDAI.DragonBreath.prototype.onWield = function(player) {
	RLD.setMessage("You drink " + this.getPronoun() + " and breath fire", gVars.message.PLAYER);
	player.location.getVisibleMonsters().forEach(function(monster) {
		this.hitAction(monster);
	}.bind(this))
	player.inventory.removeOccupant(this);
}

RLDAI.Wine = function() {
	RLDA.Item.Hardware.call(this);
	this.trade = {cost: RL.getRandom(4, 7), currency: RLDAI.Gold.prototype}
}
RLDAI.Wine.prototype = Object.create(RLDA.Item.Hardware.prototype);
RLDAI.Wine.prototype.constructor = RLDAI.Wine;
RLDAI.Wine.prototype.name = "Bottle of Wine";
RLDAI.Wine.prototype.className = "wine";
RLDAI.Wine.prototype.desc = "Should be nice with dinner";
RLDAI.Wine.prototype.onWield = function() {
	RLD.setMessage("Getting drunk in a dungeon is not a good idea", gVars.message.GAME);
}

RLDAI.Gold = function() {
	RLDA.Item.Gold.call(this);
	this.amount = RL.getRandom(4, 7);
}
RLDAI.Gold.prototype = Object.create(RLDA.Item.Gold.prototype);
RLDAI.Gold.prototype.constructor = RLDAI.Gold;
RLDAI.Gold.prototype.name = "Gold";
RLDAI.Gold.prototype.className = "gold";
RLDAI.Gold.prototype.desc = "Legal tender throughout the dungeon.";

RLDAI.Adamantite = function() {
	RLDA.Item.Gold.call(this);
	this.amount = RL.getRandom(2499, 4999);
}
RLDAI.Adamantite.prototype = Object.create(RLDA.Item.Gold.prototype);
RLDAI.Adamantite.prototype.constructor = RLDAI.Adamantite;
RLDAI.Adamantite.prototype.name = "Adamantite";
RLDAI.Adamantite.prototype.className = "adamantite";
RLDAI.Adamantite.prototype.desc = "A rare and precious metal. Accepted as payment by the Dwarven Trader.";

RLDAI.TrippyMushroom = function() {
	RLDA.Item.Food.call(this);
}
RLDAI.TrippyMushroom.prototype = Object.create(RLDA.Item.Food.prototype);
RLDAI.TrippyMushroom.prototype.constructor = RLDAI.TrippyMushroom;
RLDAI.TrippyMushroom.prototype.name = "Coloured Mushrooms";
RLDAI.TrippyMushroom.prototype.className = "trippy-mushroom";
RLDAI.TrippyMushroom.prototype.desc = "Bright, Psychodelic Mushrooms. They look like fun to eat!";

RLDAI.YellowMushroom = function() {
	RLDA.Item.Food.call(this);
}
RLDAI.YellowMushroom.prototype = Object.create(RLDA.Item.Food.prototype);
RLDAI.YellowMushroom.prototype.constructor = RLDAI.YellowMushroom;
RLDAI.YellowMushroom.prototype.name = "Yellow Mushroom";
RLDAI.YellowMushroom.prototype.className = "yellow-mushroom";
RLDAI.YellowMushroom.prototype.desc = "Species: Dexteriosa Improvitus";
RLDAI.YellowMushroom.prototype.eatAction = function(actor) {
	var message = "";
	if (actor.dex < gVars.item.MAX_ATTRIBUTE) {
		actor.dex += 1;
		message = " Your dexterity has improved.";
	}
	actor.inventory.removeOccupant(this);
	RLD.setMessage(this.getPronoun(true) + " is very delicious." + message, gVars.message.PLAYER);
}

RLDAI.Pick = function() {
	RLDA.Item.Weapon.call(this);
	this.trade = {cost: 2, currency: RLDAI.Gold.prototype}
}
RLDAI.Pick.prototype = Object.create(RLDA.Item.Weapon.prototype);
RLDAI.Pick.prototype.constructor = RLDAI.Pick;
RLDAI.Pick.prototype.name = "Mining Pick";
RLDAI.Pick.prototype.className = "pick";
RLDAI.Pick.prototype.desc = "Useful for tunnelling into walls.";
RLDAI.Pick.prototype.dmin = 1;
RLDAI.Pick.prototype.dmax = 2;

RLDAI.Dagger = function() {
	RLDA.Item.Weapon.call(this);
}
RLDAI.Dagger.prototype = Object.create(RLDA.Item.Weapon.prototype);
RLDAI.Dagger.prototype.constructor = RLDAI.Dagger;
RLDAI.Dagger.prototype.name = "Dagger";
RLDAI.Dagger.prototype.className = "dagger";
RLDAI.Dagger.prototype.desc = "A short two-edged blade perfect for thrusting.";
RLDAI.Dagger.prototype.dmin = 2;
RLDAI.Dagger.prototype.dmax = 4;

RLDAI.ShortSword = function() {
	RLDA.Item.Weapon.call(this);
}
RLDAI.ShortSword.prototype = Object.create(RLDA.Item.Weapon.prototype);
RLDAI.ShortSword.prototype.constructor = RLDAI.ShortSword;
RLDAI.ShortSword.prototype.name = "Short Sword";
RLDAI.ShortSword.prototype.className = "short-sword";
RLDAI.ShortSword.prototype.desc = "A short two-edged blade. Much better than a dagger.";
RLDAI.ShortSword.prototype.dmin = 3;
RLDAI.ShortSword.prototype.dmax = 6;

RLDAI.LongSword = function() {
	RLDA.Item.Weapon.call(this);
}
RLDAI.LongSword.prototype = Object.create(RLDA.Item.Weapon.prototype);
RLDAI.LongSword.prototype.constructor = RLDAI.LongSword;
RLDAI.LongSword.prototype.name = "Long Sword";
RLDAI.LongSword.prototype.className = "long-sword";
RLDAI.LongSword.prototype.desc = "A sword fit for a King!.";
RLDAI.LongSword.prototype.dmin = 4;
RLDAI.LongSword.prototype.dmax = 8;

RLDAI.Hammer = function() {
	RLDA.Item.Weapon.call(this);
}
RLDAI.Hammer.prototype = Object.create(RLDA.Item.Weapon.prototype);
RLDAI.Hammer.prototype.constructor = RLDAI.Hammer;
RLDAI.Hammer.prototype.name = "Great Hammer of Agarwaen";
RLDAI.Hammer.prototype.className = "hammer";
RLDAI.Hammer.prototype.desc = "Finally! A weapon of destruction... The Boss doesn't stand a chance!";
RLDAI.Hammer.prototype.dmin = 6;
RLDAI.Hammer.prototype.dmax = 12;
RLDAI.Hammer.prototype.takeAction = function(player) {
	if (player.str < 20) {
		RLD.setMessage("You cannot lift the hammer. You need at least 20 strength", gVars.message.GAME);
		return;
	}
	if (!(player.body.amulet.getPrimaryOccupant() instanceof RLDAI.AmuletMother)) {
		RLD.setMessage("You need more inner strength to lift the hammer. Maybe wear your mother's amulet...", gVars.message.GAME);
		return;
	}
	this.onTake(player);
}

RLDAI.LongBow = function() {
	RLDA.Item.Bow.call(this);
}
RLDAI.LongBow.prototype = Object.create(RLDA.Item.Bow.prototype);
RLDAI.LongBow.prototype.constructor = RLDAI.LongBow;
RLDAI.LongBow.prototype.name = "Long Bow";
RLDAI.LongBow.prototype.className = "long-bow";
RLDAI.LongBow.prototype.desc = "Straight out of Sherwood Forest.";

RLDAI.Arrows = function() {
	RLDA.Item.Arrow.call(this);
	this.amount = RL.getRandom(4, 8);
}
RLDAI.Arrows.prototype = Object.create(RLDA.Item.Arrow.prototype);
RLDAI.Arrows.prototype.constructor = RLDAI.Arrows;
RLDAI.Arrows.prototype.name = "Arrows";
RLDAI.Arrows.prototype.className = "arrows";
RLDAI.Arrows.prototype.desc = "Plain, wooden arrows can be shot with a bow.";
RLDAI.Arrows.prototype.dmin = 4;
RLDAI.Arrows.prototype.dmax = 7;

// Armours

RLDAI.LeatherArmour = function() {
	RLDA.Item.Armour.call(this);
}
RLDAI.LeatherArmour.prototype = Object.create(RLDA.Item.Armour.prototype);
RLDAI.LeatherArmour.prototype.constructor = RLDAI.LeatherArmour;
RLDAI.LeatherArmour.prototype.name = "Leather Armour";
RLDAI.LeatherArmour.prototype.className = "leather";
RLDAI.LeatherArmour.prototype.desc = "Flexible protection.";
RLDAI.LeatherArmour.prototype.ac = 1;

RLDAI.ScaleMail = function() {
	RLDA.Item.Armour.call(this);
}
RLDAI.ScaleMail.prototype = Object.create(RLDA.Item.Armour.prototype);
RLDAI.ScaleMail.prototype.constructor = RLDAI.ScaleMail;
RLDAI.ScaleMail.prototype.name = "Metal Scale Mail";
RLDAI.ScaleMail.prototype.className = "scale";
RLDAI.ScaleMail.prototype.desc = "Close-fitting hard armour.";
RLDAI.ScaleMail.prototype.ac = 2;

RLDAI.PlateArmour = function() {
	RLDA.Item.Armour.call(this);
}
RLDAI.PlateArmour.prototype = Object.create(RLDA.Item.Armour.prototype);
RLDAI.PlateArmour.prototype.constructor = RLDAI.PlateArmour;
RLDAI.PlateArmour.prototype.name = "Mithril Plate Armour";
RLDAI.PlateArmour.prototype.className = "plate";
RLDAI.PlateArmour.prototype.desc = "Magically strong, and light plate armour.";
RLDAI.PlateArmour.prototype.ac = 3;

RLDAI.AdamantiteArmour = function() {
	RLDA.Item.Armour.call(this);
}
RLDAI.AdamantiteArmour.prototype = Object.create(RLDA.Item.Armour.prototype);
RLDAI.AdamantiteArmour.prototype.constructor = RLDAI.AdamantiteArmour;
RLDAI.AdamantiteArmour.prototype.name = "Adamantite Armour";
RLDAI.AdamantiteArmour.prototype.className = "adamantite-armour";
RLDAI.AdamantiteArmour.prototype.desc = "Strong armour, finely woven adamantite crafted by the Dwarven metal smiths.";
RLDAI.AdamantiteArmour.prototype.ac = 4;

RLDAI.ShieldHaradrim = function() {
	RLDA.Item.Shield.call(this);
}
RLDAI.ShieldHaradrim.prototype = Object.create(RLDA.Item.Shield.prototype);
RLDAI.ShieldHaradrim.prototype.constructor = RLDAI.ShieldHaradrim;
RLDAI.ShieldHaradrim.prototype.name = "Shield of Haradrim";
RLDAI.ShieldHaradrim.prototype.className = "shield";
RLDAI.ShieldHaradrim.prototype.desc = "The decorated shield of a chieftain of Far Harad. Its wielder will fear nothing and fight with unnatural strength, but also draw attention to themselves."
RLDAI.ShieldHaradrim.prototype.ac = 2;

// Rings

RLDAI.RingStr = function() {
	RLDA.Item.Ring.call(this);
}
RLDAI.RingStr.prototype = Object.create(RLDA.Item.Ring.prototype);
RLDAI.RingStr.prototype.constructor = RLDAI.RingStr;
RLDAI.RingStr.prototype.name = "Ring of Strength";
RLDAI.RingStr.prototype.className = "ring-str";
RLDAI.RingStr.prototype.desc = 'The wearer has superhuman strength.'
RLDAI.RingStr.prototype.ac = 0;
RLDAI.RingStr.prototype.wieldAction = function(player) {
	player.str += 4;
	RLD.setMessage("Your strength has increased by 4", gVars.message.GAME);
	this.onWield(player);
}
RLDAI.RingStr.prototype.removeAction = function(player) {
	player.str -= 4;
	RLD.setMessage("Your strength has decreased by 4", gVars.message.GAME);
	var hammer = player.alreadyHas(RLDAI.Hammer.prototype);
	if (hammer) {
		hammer.dropAction(player);
	}
	this.onRemove(player);
}

RLDAI.RingOne = function() {
	RLDA.Item.Ring.call(this);
}
RLDAI.RingOne.prototype = Object.create(RLDA.Item.Ring.prototype);
RLDAI.RingOne.prototype.constructor = RLDAI.RingOne;
RLDAI.RingOne.prototype.name = "The One Ring";
RLDAI.RingOne.prototype.className = "ring-one";
RLDAI.RingOne.prototype.desc = '"One Ring to rule them all, One Ring to find them, One Ring to bring them all and in the darkness bind them." Made of massive gold, and inscribed with hidden runes in the foul speech of Mordor, Isildur\'s Bane possesses powers so great that it inevitably twists and masters any mortal being who wears it.'
RLDAI.RingOne.prototype.ac= 2;

RLDAI.RingVilya = function() {
	RLDA.Item.Ring.call(this);
}
RLDAI.RingVilya.prototype = Object.create(RLDA.Item.Ring.prototype);
RLDAI.RingVilya.prototype.constructor = RLDAI.RingVilya;
RLDAI.RingVilya.prototype.name = "Vilya";
RLDAI.RingVilya.prototype.className = "ring1";
RLDAI.RingVilya.prototype.desc = "The Ring of Sapphire, made of gold with a brilliant blue gem that shines like stars. It glitters untouchable despite all that Morgoth ever wrought. Vilya is one of the three Rings of Power created by Celebrimbor and hidden by the Elves from Sauron.";
RLDAI.RingVilya.prototype.ac = 1;

RLDAI.RingNenya = function() {
	RLDA.Item.Ring.call(this);
}
RLDAI.RingNenya.prototype = Object.create(RLDA.Item.Ring.prototype);
RLDAI.RingNenya.prototype.constructor = RLDAI.RingNenya;
RLDAI.RingNenya.prototype.name = "Nenya";
RLDAI.RingNenya.prototype.className = "ring2";
RLDAI.RingNenya.prototype.desc = "The Ring of Adamant, made of mithril with a pure white stone as centerpiece. Nenya is one of the three Rings of Power created by Celebrimbor and hidden by the Elves from Sauron.";
RLDAI.RingNenya.prototype.ac = 1;

RLDAI.RingBarahir = function() {
	RLDA.Item.Ring.call(this);
}
RLDAI.RingBarahir.prototype = Object.create(RLDA.Item.Ring.prototype);
RLDAI.RingBarahir.prototype.constructor = RLDAI.RingBarahir;
RLDAI.RingBarahir.prototype.name = "Ring of Barahir";
RLDAI.RingBarahir.prototype.className = "ring3";
RLDAI.RingBarahir.prototype.desc = "Twinned serpents with eyes of emerald meet beneath a crown of flowers to form this ring, an ancient treasure of Isildur's house.";
RLDAI.RingBarahir.prototype.ac = 2;

RLDAI.RingTulkas = function() {
	RLDA.Item.Ring.call(this);
}
RLDAI.RingTulkas.prototype = Object.create(RLDA.Item.Ring.prototype);
RLDAI.RingTulkas.prototype.constructor = RLDAI.RingTulkas;
RLDAI.RingTulkas.prototype.name = "Ring of Tulkas";
RLDAI.RingTulkas.prototype.className = "ring4";
RLDAI.RingTulkas.prototype.desc = "The treasure of Tulkas. The wearer gains 10 extra HP.";
RLDAI.RingTulkas.prototype.ac = 0;
RLDAI.RingTulkas.prototype.wieldAction = function(player) {
	player.hp += 10;
	RLD.setMessage("Your HP has increased by 10", gVars.message.GAME);
	this.onWield(player);
}
RLDAI.RingTulkas.prototype.removeAction = function(player) {
	player.hp -= 10;
	RLD.setMessage("Your HP has decreased by 10", gVars.message.GAME);
	this.onRemove(player);
}

// Pendants

RLDAI.AmuletMother = function() {
	RLDA.Item.Amulet.call(this);
}
RLDAI.AmuletMother.prototype = Object.create(RLDA.Item.Amulet.prototype);
RLDAI.AmuletMother.prototype.constructor = RLDAI.AmuletMother;
RLDAI.AmuletMother.prototype.name = "Pendant from your Mum";
RLDAI.AmuletMother.prototype.className = "amulet-mother";
RLDAI.AmuletMother.prototype.desc = "A treasured gift from your Mum on your 12th birthday. She said it would would always protect you from the monsters you saw in your dreams."
RLDAI.AmuletMother.prototype.ac = 0;
RLDAI.AmuletMother.prototype.removeAction = function(player) {
	var hammer = player.alreadyHas(RLDAI.Hammer.prototype);
	if (hammer) {
		hammer.dropAction(player);
	}
	this.onRemove(player);
}


RLDAI.AmuletCarlammas = function() {
	RLDA.Item.Amulet.call(this);
}
RLDAI.AmuletCarlammas.prototype = Object.create(RLDA.Item.Amulet.prototype);
RLDAI.AmuletCarlammas.prototype.constructor = RLDAI.AmuletCarlammas;
RLDAI.AmuletCarlammas.prototype.name = "Amulet of Carlammas";
RLDAI.AmuletCarlammas.prototype.className = "amulet1";
RLDAI.AmuletCarlammas.prototype.desc = "The treasure of Tulkas, most fleet and wrathful of the Valar."
RLDAI.AmuletCarlammas.prototype.ac = 1;

RLDAI.AmuletIngwe = function() {
	RLDA.Item.Amulet.call(this);
}
RLDAI.AmuletIngwe.prototype = Object.create(RLDA.Item.Amulet.prototype);
RLDAI.AmuletIngwe.prototype.constructor = RLDAI.AmuletIngwe;
RLDAI.AmuletIngwe.prototype.name = "Amulet of Ingwe";
RLDAI.AmuletIngwe.prototype.className = "amulet2";
RLDAI.AmuletIngwe.prototype.desc = "The ancient heirloom of Ingwë, high lord of the Vanyar, against whom nothing of evil could stand."
RLDAI.AmuletIngwe.prototype.ac = 2;

RLDAI.AmuletDwarves = function() {
	RLDA.Item.Amulet.call(this);
}
RLDAI.AmuletDwarves.prototype = Object.create(RLDA.Item.Amulet.prototype);
RLDAI.AmuletDwarves.prototype.constructor = RLDAI.AmuletDwarves;
RLDAI.AmuletDwarves.prototype.name = "Necklace of the Dwarves";
RLDAI.AmuletDwarves.prototype.className = "amulet3";
RLDAI.AmuletDwarves.prototype.desc = "The Nauglamír, a carcanet of gold set with a multitude of shining gems of Valinor. The radiant Silmaril of Fëanor hangs in its midst as its crowning glory. The sturdy spirits of Dwarvish craftsmen who labored long in mountain smithies lie within it still, and as gossamer it rests upon the bearer."
RLDAI.AmuletDwarves.prototype.ac = 3;

RLDAI.AmuletElessar = function() {
	RLDA.Item.Amulet.call(this);
}
RLDAI.AmuletElessar.prototype = Object.create(RLDA.Item.Amulet.prototype);
RLDAI.AmuletElessar.prototype.constructor = RLDAI.AmuletElessar;
RLDAI.AmuletElessar.prototype.name = "The Elfstone 'Elessar'";
RLDAI.AmuletElessar.prototype.className = "amulet4";
RLDAI.AmuletElessar.prototype.desc = "A precious stone, imbued with the power of Elvendom and the light of the Sun. Those who gaze through it see the aged and infirm as young again, and its wearer brings healing after victory in battle."
RLDAI.AmuletElessar.prototype.ac = 4;

