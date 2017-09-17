
gVars.view = {}
gVars.view.TILE_SIZE = 32;
gVars.view.VIEWPORT_W = gVars.view.TILE_SIZE * 15;
gVars.view.VIEWPORT_H = gVars.view.TILE_SIZE * 15;
gVars.view.MINIMAP = 4;
gVars.view.SHOOT_DISTANCE = 3;

gVars.view.keyCodes = {
	38: gVars.dir.N,
	85: gVars.dir.NE,
	39: gVars.dir.E,
	78: gVars.dir.SE,
	40: gVars.dir.S,
	66: gVars.dir.SW,
	37: gVars.dir.W,
	89: gVars.dir.NW,
}

// shorthand
RL.View = {}
var RLV = RL.View;

// for indexes
RLV.guid = function() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
	    return v.toString(16);
	});
}

// Tiles live on the main map
RLV.Tile = React.createClass({

	handleClick: function(event) {
		this.props.handleClick(this.props.tile);
	},

	render: function() {
		var tile = this.props.tile;
		var style = {
			width: gVars.view.TILE_SIZE,
			height: gVars.view.TILE_SIZE,
			top: tile.row * gVars.view.TILE_SIZE,
			left: tile.col * gVars.view.TILE_SIZE
		}
		var className = (tile.isWall() ? "wall" : "tile floor") +
				(tile.isFOV() || this.props.lightsOn ? "" : (tile.isSeen() ? " seen" : " not-seen"));
		var actor = ((tile.isFOV() || this.props.lightsOn) && tile.isOccupied()) ?
			<RLV.ActorIcon occupant={tile.getPrimaryOccupant()} multiple={tile.getItems().length} /> : "";
		return (
			<div className={className} style={style} onClick={this.handleClick}>
				{actor}
			</div>
		);
	}
})

// TODO Tile and MiniTile are too much duplication
// Minitiles live on the Minimap
RLV.MiniTile = React.createClass({
	render: function() {
		var tile = this.props.tile;
		var style = {
			width: gVars.view.MINIMAP,
			height: gVars.view.MINIMAP,
			top: tile.row * gVars.view.MINIMAP,
			left: tile.col * gVars.view.MINIMAP
		};
		var className = (tile.isWall() ? "wall" : "tile") +
				(tile.isFOV() || this.props.lightsOn ? "" : (tile.isSeen() ? " seen" : " not-seen"));
		if (tile.isPlayer()) {
			style = Object.assign({}, style, tile.getPrimaryOccupant().cssStyle);
		}
		return (
			<div className={className} style={style} />
		);
	}
})

// The level holds all the tiles
// This layer moves while the player tile stays in the center of focus
RLV.Level = React.createClass({
	render: function() {
		var playerTile = this.props.playerTile;
		var level = playerTile.level;
		var levelStyle = {
			width: (level.cols * gVars.view.TILE_SIZE) + gVars.view.VIEWPORT_W,
			height: (level.rows * gVars.view.TILE_SIZE) + gVars.view.VIEWPORT_H,
			top: playerTile.row * gVars.view.TILE_SIZE * -1,
			left: playerTile.col * gVars.view.TILE_SIZE * -1
		};
		var tilesStyle = {
			width: level.cols * gVars.view.TILE_SIZE,
			height: level.rows * gVars.view.TILE_SIZE,
			top: (gVars.view.VIEWPORT_H / 2) - (gVars.view.TILE_SIZE / 2),
			left: (gVars.view.VIEWPORT_W / 2) - (gVars.view.TILE_SIZE / 2)
		};
		var tiles = level.tiles.map(function(tile, i) {
			return <RLV.Tile key={i} tile={tile} handleClick={this.props.handleClick} lightsOn={level.lightsOn} />;
		}.bind(this));
		return (
			<div className="level" style={levelStyle}>
				<panel className="tiles" style={tilesStyle}>
					{tiles}
				</panel>
			</div>
		);
	}
})

// TODO Level and MiniMap are too much duplication
RLV.MiniMap = React.createClass({
	render: function() {
		var level = this.props.level;
		var style = {
			width: level.cols * gVars.view.MINIMAP,
			height: level.rows * gVars.view.MINIMAP
		};
		var tiles = level.tiles.map(function(tile, i) {
			return <RLV.MiniTile key={i} tile={tile} lightsOn={level.lightsOn} />;
		});
		return (
			<div className="minimap" style={style}>
				<panel className="minitiles" style={style}>
					{tiles}
				</panel>
			</div>
		);
	}
})

// Panel to show player information and messages
RLV.StatusPanel = React.createClass({
	render: function() {
		var player = this.props.player;
		var hp = player.getHP();
		var hpClass = hp <= hp * 0.1 ? gVars.message.URGENT : hp <= 0.2 ?
			gVars.message.WARNING : gVars.message.GOOD;
		var hpStyle = {
		}
		return (
			<div className="stats">
				<p>DUNGEON LEVEL <span>{player.location.level.lvl}</span>
				&nbsp;&nbsp;&nbsp;TURN <span>{this.props.turn}</span><br />
				HEALTH <div className={hpClass}>{player.getHP()}</div>
				&nbsp;&nbsp;&nbsp; XP <span>{player.xp}</span>
				&nbsp;&nbsp;&nbsp; ARMOUR CLASS <span>{player.getAC()}</span>
				&nbsp;&nbsp;&nbsp; STRENGTH <span>{player.str}</span>
				&nbsp;&nbsp;&nbsp; DEXTERITY <span>{player.dex}</span></p>
			</div>
		);
	}
})

RLV.Message = React.createClass({
	render: function() {
		return (
			<li className={this.props.message.className}>{this.props.message.text} </li>
		);
	}
})

RLV.MessagePanel = React.createClass({
	render: function() {
		var messages = this.props.messages.map(function(message, i) {
			return <RLV.Message key={i} message={message} />
		}.bind(this));
		return (
			<ul>{messages}</ul>
		);
	}
})

// Container for the level 
RLV.ViewPort = React.createClass({
	getInitialState: function() {
		return {
			style: {
				width: gVars.view.VIEWPORT_W,
				height: gVars.view.VIEWPORT_H
			}
		}
	},
	render: function() {
		return (
			<div className="viewport" style={this.state.style}>
				<RLV.Level playerTile={this.props.playerTile} handleClick={this.props.handleClick}/>
			</div>
		);
	}
})

RLV.TitlePanel = React.createClass({
	render: function() {
		return (
			<div className="title">
				ROGUE
			</div>
		);
	}
})

RLV.ActorChipButton = React.createClass({
	onClick: function() {
		this.props.onClick(this.props.occupant);
	},
	render: function() {
		var tooltip = <ReactBootstrap.Tooltip>{this.props.desc}</ReactBootstrap.Tooltip>;
		return (
		    <ReactBootstrap.OverlayTrigger placement="top" overlay={tooltip}>
				<i className={this.props.className} onClick={this.onClick} />		
		    </ReactBootstrap.OverlayTrigger>
		);
	}
})

RLV.ActorIcon = React.createClass({
	render: function() {
		var occupant = this.props.occupant;
		var multiple = this.props.multiple > 1;
		var style = {
			width: gVars.view.TILE_SIZE,
			height: gVars.view.TILE_SIZE
		};
		var tooltipStyle = {
			width: 64,
			height: 64,
			borderRadius: 4,
			margin: 5,
			backgroundColor: "#9fa6ad",
			display: "block",
			marginLeft: "auto",
			marginRight: "auto",
		}
		style = Object.assign({}, style, multiple ? RLDA.Item.cssStyle : occupant.cssStyle);
		var title = multiple ? this.props.multiple : occupant.name;
		var desc = multiple ? "items here" : occupant.desc;
		var stats = multiple ? "" : occupant.getStats();
		var className = multiple ? "chip-icon" : occupant.getClassName(); 
		var content = multiple ? this.props.multiple : "";
		var tooltip = <ReactBootstrap.Tooltip><strong>{title}</strong><br />
			<div className={className} style={tooltipStyle}/>{desc}<br />
			{stats}</ReactBootstrap.Tooltip>;
		return (
		    <ReactBootstrap.OverlayTrigger placement="top" overlay={tooltip}>
				<div className={className} style={style}>{content}</div>				
		    </ReactBootstrap.OverlayTrigger>
		);
	}
})

RLV.ActorChip = React.createClass({
	render: function() {
		var occupant = this.props.occupant;
		return (
			<div className="actor-chip">
				<RLV.ActorIcon occupant={occupant} />
				<div className="chip-name">{occupant.getChipDescription()}</div>
				{this.props.buttons}
			</div>
		);
	}
})

RLV.BodyPart = React.createClass({
	render: function() {
		var bodyPart = this.props.bodyPart;
		var occupant = this.props.occupant;
		var removeBtn = <RLV.ActorChipButton occupant={occupant}
			className="fa fa-times" onClick={this.props.onRemove} desc="Remove" />;
		var item = <RLV.ActorChip key={RLV.guid()} occupant={occupant} buttons={[removeBtn]} />;
		return (
			<div>
				<span>{bodyPart.toUpperCase()}</span><br />
				{item}
			</div>
		);
	}
})

RLV.Wearing = React.createClass({
	render: function() {
		var wearing = this.props.wearing;
		var items = [];
		for (var key in wearing) {
			var occupant = wearing[key].getPrimaryOccupant();
			if (occupant) {
				items.push(<RLV.BodyPart bodyPart={wearing[key].name}
					occupant={occupant} onRemove={this.props.onRemove} />);
			}
		}
		return (
			<div className="wearing">
				YOU ARE WEARING/WIELDING:
				{items}
			</div>
		);
	}
})

RLV.Purse = React.createClass({
	render: function() {
		var purse = this.props.purse;
		var items = purse.getOccupants().map(function(item, i) {
			var dropBtn = <RLV.ActorChipButton occupant={item}
				className="fa fa-times" onClick={this.props.onDrop} desc="Drop at your Location" />;
			return <RLV.ActorChip key={i} occupant={item} buttons={[dropBtn]} />
		}.bind(this));
		return (
			<div className="purse">
				IN YOUR PURSE:<br />
				{items}
			</div>
		);
	}
})

RLV.Inventory = React.createClass({
	render: function() {
		var inventory = this.props.inventory;
		var purse = this.props.purse;
		var items = inventory.getOccupants().map(function(item, i) {
			var className, onClick, desc;
			if (item instanceof RLDA.Item.Food) {
				className = "fa fa-cutlery";
				onClick = this.props.onEat;
				desc = "Eat";
			} else if (item instanceof RLDA.Item.Magic) {
				className = "fa fa-magic";
				onClick = this.props.onCast;
				desc = "Cast Spell";			
			} else if (!(item instanceof RLDA.Item.Gold)) {
				className = "fa fa-check";
				onClick = this.props.onWield;
				desc = "Wear/Wield/Use";			
			}
			var wieldBtn = <RLV.ActorChipButton occupant={item}
					className={className} onClick={onClick} desc={desc} />;
			var dropBtn = <RLV.ActorChipButton occupant={item}
				className="fa fa-times" onClick={this.props.onDrop} desc="Drop at your Location" />;
			return <RLV.ActorChip key={i} occupant={item} buttons={[wieldBtn, dropBtn]} />
		}.bind(this));
		var purseItems = purse.getOccupants().map(function(item, i) {
			var dropBtn = <RLV.ActorChipButton occupant={item}
				className="fa fa-times" onClick={this.props.onDrop} desc="Drop at your Location" />;
			return <RLV.ActorChip key={i} occupant={item} buttons={[dropBtn]} />
		}.bind(this));
		var amount = inventory.occupants.length + " / " + gVars.player.INV_LIMIT + " ITEMS";
		return (
			<div>
				<div className="inventory">
					{amount} IN YOUR BACKPACK:<br />
					{items}
				</div>
				<div className="inventory">
					IN YOUR PURSE:<br />
					{purseItems}
				</div>
			</div>
		);
	}
})

RLV.PlayerLocation = React.createClass({
	render: function() {
		var playerLocation = this.props.playerLocation;
		var items = playerLocation.getItemsBelowPlayer().map(function(item, i) {
			var takeBtn = <RLV.ActorChipButton occupant={item}
				className="fa fa-check" onClick={this.props.onTake} desc="Add to Inventory" />;
			return <RLV.ActorChip key={i} occupant={item} buttons={[takeBtn]} />
		}.bind(this));
		return (
			<div className="player-location">
			AT YOUR LOCATION: 
			{items}
			</div>
		);
	}
})

RLV.Dungeon = React.createClass({
	getInitialState: function() {
		this.createDungeon();
		return {
			level: RLD.level,
			player: RLD.player, 
			messages: RLD.messages,
			turn: RLD.turn,
			welcome: true,
			summons: false,
			eog: false,
			congratulations: false
		}
	},
	componentDidMount: function() {
		$(document).keydown(function(e) {
			var key = e.which;
			switch(key) {
				case 37:
				case 38:
				case 39:
				case 40:
				case 89:
				case 85:
				case 66:
				case 71:
				case 78:
				case 188:
				case 190:
					this.handleKey(key);
					break;
			}
		}.bind(this));
	},
	createDungeon: function() {
		RLD.levels.length = 0;
		RLD.turn = 0;
		RLD.messages.length = 0;
		RLD.level = RLD.createLevel();
		// TODO player creation should be outside this method ?
		RLD.player = new RLDA.PlayerRace.Human();
		RLD.player.pClass = new RLDA.PlayerClass.Fighter();
		RLD.player.move(RLD.level.getRandomTile());
		RLD.level.swapFOV([], RLD.player.location.getFOV());
		RLD.player.house = RLD.level.createTown();
	},
	handleKey: function(key) {
		switch(key) {
			case 37:
			case 38:
			case 39:
			case 40:
			case 89:
			case 85:
			case 66:
			case 78:
				this.handleMove(key); break;
			case 71:
				this.takeKeyAction(); break;
			case 188:
				this.changeLevelDown(); break;
			case 190:
				this.changeLevelUp(); break;
		}
		this.computerAI();
	},
	computerAI: function() {
		RLD.level.monsters.forEach(function(monster) {
			monster.AIAction(RLD.player);
		});
		if (RLD.turn % 5 == 0) {
			RLD.player.heal();
			RLD.level.monsters.forEach(function(monster) {
				monster.heal();
			})			
		}
		RLD.turn++;
		this.setStdState();
	},
	eatAction: function(item) {
		RLD.messages.length = 0;
		item.eatAction(RLD.player);
		this.computerAI();
	},
	takeKeyAction: function() {
		var items = RLD.player.location.getItemsBelowPlayer();
		if (items.length != 0) this.takeAction(items[0]);
	},
	takeAction: function(item) {
		RLD.messages.length = 0;
		item.takeAction(RLD.player);
		this.computerAI();
	},
	wieldAction: function(item) {
		RLD.messages.length = 0;
		item.wieldAction(RLD.player);
		this.computerAI();
	},
	castAction: function(item) {
		RLD.messages.length = 0;
		item.castAction(RLD.player);
		this.computerAI();
	},
	removeAction: function(item) {
		RLD.messages.length = 0;
		if (!RLD.player.inventory.canAdd()) {
			RLD.setMessage("Your backpack cannot hold any more than " + gVars.player.INV_LIMIT + " items", gVars.message.GAME);
			return;
		}
		item.removeAction(RLD.player);
		this.computerAI();
	},
	dropAction: function(item) {
		RLD.messages.length = 0;
		item.dropAction(RLD.player);
		this.computerAI();
	},

	// MOVEMENT GROUP
	// ComputerAI is called by the top level
	handleMove: function(key) {
		var player = RLD.player;
		var playerTile = player.location;
		var direction = gVars.view.keyCodes[key];
		RLD.messages.length = 0;
		if (player.body.weapon.getPrimaryOccupant() instanceof RLDAI.Pick) {
			var tile = playerTile.neighbours[direction];
			if (tile.isWall()) {
				this.miningAction(tile);
			}
		}
		var nextTile = playerTile.canGo(direction);
		if (!nextTile) return;
		if (nextTile.isMonster()) {
			this.meleeAction(nextTile.getPrimaryOccupant());
		} else {
			var nextFOV = nextTile.getFOV();
			RLD.level.swapFOV(playerTile.getFOV(), nextFOV);
			player.move(nextTile);
			playerTile = player.location;
			playerTile.level.createDijkstraMap(playerTile, nextFOV, "attack");	
		}
	},
	miningAction: function(tile) {
		if (RL.getRandom(1, 100) <= 50) {
			tile.status &= ~gVars.wall.WALL;
			tile.status |= gVars.wall.FOV;
			tile.status |= gVars.wall.SEEN;
			RLD.setMessage("You have successfully mined the wall");
			return;
		}
		RLD.setMessage("Keep trying... The stone is tough here", gVars.message.GAME);
	},
	meleeAction: function(monster) {
		var weapon = RLD.player.body.weapon;
		if (!weapon.isOccupied()) {
			RLD.setMessage("You are not wielding any weapon! You don't do any damage!", gVars.message.GAME);
		} else {
			weapon.getPrimaryOccupant().hitAction(monster);
		}
	},
	changeLevelDown: function() {
		RLD.messages.length = 0;
		if (!(RLD.player.location.status & gVars.wall.STAIRS_DOWN)) {
			RLD.setMessage("You are not standing on any stairs leading down", gVars.message.GAME);
			return;
		}
		RLD.level.lastPlayerLocation = RLD.player.location;
		if (RLD.level.lvl == RLD.levels.length - 1) {
			RLD.level = RLD.createLevel();
			var tile = RLD.level.getRandomTile();
			RLD.level.createStairs(gVars.wall.STAIRS_UP, tile);
			RLD.player.move(tile);
			RLD.setMessage("Welcome to Level " + RLD.level.lvl, gVars.message.GAME);
			if (RLD.level.lvl > 1) {
				RLD.player.hp += RLD.player.hpl;
				RLD.setMessage("Your HP has increased to: " + RLD.player.hp, gVars.message.GAME);			
			}
		} else {
			RLD.level = RLD.levels[RLD.level.lvl + 1];
			RLD.player.move(RLD.level.lastPlayerLocation);
			RLD.setMessage("You are on Level " + RLD.level.lvl, gVars.message.GAME);
		}
		RLD.level.swapFOV([], RLD.player.location.getFOV());
	},
	changeLevelUp: function() {
		RLD.messages.length = 0;
		if (!(RLD.player.location.status & gVars.wall.STAIRS_UP)) {
			RLD.setMessage("You are not standing on any stairs leading up", gVars.message.GAME);
			return;
		}
		if (RLD.level.lvl === 0) return;
		RLD.level.lastPlayerLocation = RLD.player.location;
		RLD.level = RLD.levels[RLD.level.lvl - 1];
		RLD.player.move(RLD.level.lastPlayerLocation);
		RLD.level.swapFOV([], RLD.player.location.getFOV());
		RLD.setMessage("You are on Level " + RLD.level.lvl, gVars.message.GAME);
	},

	// CLICK GROUP - move, help, shoot
	// ComputerAI called by the handleClick method
	handleClick: function(tile) {
		RLD.messages.length = 0;
		if (!tile.isFOV() || tile.isWall()) return;
		if (tile.isPlayer()) {
			alert("need to program help dialogs");
			return;
		}
		if (tile.isMonster()) {
			this.shootAction(tile.getPrimaryOccupant());
			this.computerAI();
			return;
		}
		// BETA - click to move around in FOV - should be combined
		// with handleMove() ??
		tile.level.createDijkstraMap(tile, tile.getFOV(), "move");
		var walk = setInterval(function() {
			var startTile = RLD.player.location;
			var neighbours = startTile.dijkstraNeighbours;
			var suitable = neighbours.filter(function(neighbour) {
				var check1 = !neighbour.isMonster();
				var check2 = neighbour.dijkstraMaps.move < startTile.dijkstraMaps.move;
				return check1 && check2;
			});
			if (suitable.length > 0) {
				RLD.player.move(suitable[RL.getRandom(0, suitable.length - 1)]);
				var playerTile = RLD.player.location;
				playerTile.level.swapFOV(startTile.getFOV(), playerTile.getFOV());
				playerTile.level.createDijkstraMap(playerTile, playerTile.getFOV(), "attack");	
				this.computerAI();
				this.setState({level: RLD.level, player: RLD.player});
			} else {
				startTile.level.tiles.forEach(function(tile) {
					tile.dijkstraMaps.move = gVars.wall.DIJKSTRA_SEED;
				})
				this.cancelClickWalk(walk);
			}
		}.bind(this), 300)
	},

	cancelClickWalk: function(walk, tile) {
		clearInterval(walk);
	},

	shootAction: function(monster) {
		var player = RLD.player;
		var quiver = player.body.quiver;
		if (!player.body.bow.isOccupied() || !quiver.isOccupied()) {
			RLD.setMessage("You cannot shoot without a bow and/or arrows", gVars.message.GAME);
			return;
		}
		if (player.location.getDistance(monster.location) < gVars.view.SHOOT_DISTANCE) {
			RLD.setMessage("You are too close to shoot... stand further back", gVars.message.GAME);
			return;
		}
		quiver.getPrimaryOccupant().hitAction(monster);
	},
	setStdState: function() {
		this.setState({level: RLD.level, player: RLD.player,
			messages: RLD.messages, turn: RLD.turn, eog: RLD.player.isDead(),
			summons: RLD.summonsBoss, congratulations: RLD.congratulations});
	},

	// FORMS
	handleEndOfGame: function() {
		this.createDungeon();
		this.setStdState();
	},
	hideModal: function(form) {
		switch (form) {
			case "welcome":
				this.setState({welcome: false}); break;
			case "summons":
				RLD.summonsBoss = false;
				this.setState({summons: false}); break;
			case "congratulations":
				RLD.congratulations = false;
				this.setState({congratulations: false}); break;
			case "eog":
				this.setState({eog: false}); break;
		}
	},

	render: function() {
		return (
			<div className="dungeon">
				<div className="information">
					<RLV.TitlePanel />
					<RLV.MiniMap level={this.state.level} />
					<RLV.PlayerLocation playerLocation={this.state.player.location}
						onTake={this.takeAction} />
				</div>
				<div className="view">
					<RLV.ViewPort level={this.state.level} playerTile={this.state.player.location}
						handleClick={this.handleClick} />
					<RLV.MessagePanel className="messages" messages={this.state.messages} />
				</div>
				<div className="status">
					<RLV.StatusPanel player={this.state.player} turn={this.state.turn} />
					<div className="item-management">
						<RLV.Inventory inventory={this.state.player.inventory} purse={this.state.player.purse}
							onWield={this.wieldAction} onEat={this.eatAction} onDrop={this.dropAction}
							onCast={this.castAction} />
						<RLV.Wearing wearing={this.state.player.body} onRemove={this.removeAction} />
					</div>
				</div>
				<WelcomeForm welcome={this.state.welcome} hideModal={this.hideModal} />
				<SummonsForm summons={this.state.summons} hideModal={this.hideModal} />
				<CongratulationsForm congratulations={this.state.congratulations} hideModal={this.hideModal} />
				<EndOfGameForm eog={this.state.eog} message={RLD.eogMessage}
					hideModal={this.hideModal} handleEndOfGame={this.handleEndOfGame} />
			</div>
		);
	}
})

var WelcomeForm = React.createClass({
	close: function() {
		this.props.hideModal("welcome");
	},
	createContent: function() { 
		return {__html:  marked(welcomeText)}; 
	},
	render: function() {
		var Modal = ReactBootstrap.Modal;
		var Button = ReactBootstrap.Button;
		var title = "Welcome to Rogue";
		return (
			<div>
				<Modal className="my-modal" show={this.props.welcome} onHide={this.close}>
				<Modal.Header className="header" closeButton>
					<Modal.Title>{title}</Modal.Title>
				</Modal.Header>
				<Modal.Body className="body">
					<p dangerouslySetInnerHTML={this.createContent()} />
				</Modal.Body>
				<Modal.Footer className="header">
					<Button onClick={this.close}>OK</Button>
				</Modal.Footer>
				</Modal>
			</div>
		);
	}
});

var SummonsForm = React.createClass({
	close: function() {
		this.props.hideModal("summons");
	},
	createContent: function() { 
		return {__html: marked(summonsText)}; 
	},
	render: function() {
		var Modal = ReactBootstrap.Modal;
		var Button = ReactBootstrap.Button;
		var title = "Hear ye! Hear Ye!";
		return (
			<div>
				<Modal className="my-modal" show={this.props.summons} onHide={this.close}>
				<Modal.Header className="header" closeButton>
					<Modal.Title>{title}</Modal.Title>
				</Modal.Header>
				<Modal.Body className="body">
					<p>You hear a crash of thunder and a loud booming voice...</p>
					<p dangerouslySetInnerHTML={this.createContent()} />
				</Modal.Body>
				<Modal.Footer>
					<Button className="header" onClick={this.close}>OK</Button>
				</Modal.Footer>
				</Modal>
			</div>
		);
	}
});

var EndOfGameForm = React.createClass({
	close: function() {
		this.props.hideModal("eog");
	},
	render: function() {
		var Modal = ReactBootstrap.Modal;
		var Button = ReactBootstrap.Button;
		var title = "Bad luck!!!";
		return (
			<div>
				<Modal className="my-modal" show={this.props.eog} onHide={this.close}>
				<Modal.Header className="header" closeButton>
					<Modal.Title>{title}</Modal.Title>
				</Modal.Header>
				<Modal.Body className="body">
					<div>{this.props.message}<br />
					Game starts again from Level 0</div>	
				</Modal.Body>
				<Modal.Footer className="header">
					<Button onClick={this.props.handleEndOfGame}>OK</Button>
				</Modal.Footer>
				</Modal>
			</div>
		);
	}
});

var CongratulationsForm = React.createClass({
	close: function() {
		this.props.hideModal("congratulations");
	},
	createContent: function() { 
		return {__html: marked(congratulationsText)}; 
	},
	render: function() {
		var Modal = ReactBootstrap.Modal;
		var Button = ReactBootstrap.Button;
		var title = "Congratulations!";
		return (
			<div>
				<Modal className="my-modal" show={this.props.congratulations} onHide={this.close}>
				<Modal.Header className="header" closeButton>
					<Modal.Title>{title}</Modal.Title>
				</Modal.Header>
				<Modal.Body className="body">
					<p dangerouslySetInnerHTML={this.createContent()} />
				</Modal.Body>
				<Modal.Footer className="header">
					<Button onClick={this.close}>OK</Button>
				</Modal.Footer>
				</Modal>
			</div>
		);
	}
});

var welcomeText = 
"*Version 1.0.0*\n\n" +
"**This game is still a work in progress.**\n\n" +
"Take a look around the town before you go into the dungeons. You may want to buy some things before you go.\n\n" +
"### To move around the game\n\n" +
"* `Arrow keys` for up, down, left and right\n" +
"* `y`, `u`, `b`, `n` for diagonal\n" +
"* `<` when on a staircase to go down a level\n" +
"* `>` when on a staircase to go up a level\n\n" +
"Your player character always remains in the middle of the board. It is surrounded by a yellow circle.\n\n" +
"Mouseover items and monsters for extra information. Activity and other messages are displayed below the main board. Status is displayed top right. **If your HP reaches 0 and you die, the game will restart from 0.** There is no save. **HP are automatically restored over time (2 points per 5 turns)**, however, there are some health potions available to boost this.\n\n" +
"You can use the mouse for movement on the main board BUT this is still beta. Due to the random nature of choosing a suitable tile to walk on, it may brush pass monsters and allow them a free hit at you. It is better to use the keyboard when in melee or approaching and fleeing monsters. All movement is turn based. After every turn you make (see turn counter top right) the game will generate it’s own turn.\n\n"+
"### Getting items\n" +
"To pick up items on the board, move to that item's location and a list of items will appear to the left of the board. Select them using the mouse OR the “g” key. Items picked up will be moved to your pack (first list to the right of the board). Depending on the type of item, you can then choose to wear it, eat it, or use it.\n\n" +
"### Using Items\n" +
"Your body has slots for **Weapon, Bow, Quiver, Ring Left, Ring Right, Necklace, Armour** and **Shield.** Selecting to wear an item will move it from your pack to your body. Any item already on that part of your body will be swapped back into your pack. Your pack is limited to 6 items. Items may be dropped from your pack back onto your location on the board EXCEPT in the town, you must be on your home tile to drop items.\n\n" +
"You also have a purse for holding **gold** and **adamantite**. Adamantite is needed to purchase some items from the vendors in the town. Gold is dropped by monsters and adamantite “grows” in hard to reach places and sometimes even deep within the walls where you have to mine for it.\n\n" +
"### Attacking Monsters\n" +
"1. If you have bow and arrows, you can click on the monster to shoot at it. Arrows are limited (see the counter). You cannot shoot a monster at close range.\n" +
"2. For melee (hand-to-hand) combat, keep moving into the monster from any direction.\n" +
"3. I have tried to balance the armour, health, and damage for monsters versus player, but sometimes random is a bit cruel.\n\n" +
"After every turn you make, the game has a turn. Monsters may fight back, run away, breed, or wander depending on their class and other random effects. Most monsters *WILL* attack you on sight.\n\n" +
"#### Have Fun\n" +
"Feedback welcome."

var summonsText = 
"**Harken Oh Mighty Morgoth, Lord of darkness. Another careless mortal wishes to make battle with you.**\n" +
"**Come thither and forthwith to trounce this foolish adventurer.**\n\n" +
"You feel a dark presence nearby, and magic crackles in the air..."

var congratulationsText = 
"**Congratulations, you have finished the game.**\n\n" +
"Thanks very much for playing.\n\n" +
"Feedback welcome."

$(document).ready(function() {
	ReactDOM.render(<RLV.Dungeon />, document.getElementById('app'));
})

