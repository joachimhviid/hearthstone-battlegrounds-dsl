grammar HearthstoneBattlegroundsDsl

entry Model:
    (minions+=Minion)*;

// All, Beast, Demon, Dragon, Elemental, Mech, Murloc, Naga, Pirate, Quilboar, Undead
// Validate 'All' is always alone (not combined with other tribes)
Tribe returns string:
    'All' | 'Beast' | 'Demon' | 'Dragon' | 'Elemental' | 'Mech' | 'Murloc' | 'Naga' | 'Pirate' | 'Quilboar' | 'Undead';

// Divine Shield, Reborn, Stealth, Taunt, Venomous, or Windfury
Keyword returns string:
    'Taunt' | 'Reborn' | 'DivineShield' | 'Stealth' | 'Windfury' | 'Venomous';


Effect:
    trigger=Trigger actions+=Action ('and' actions+=Action)*;


Trigger:
    SimpleTrigger | EventTrigger;

// this (current minion instance), you (player)
TriggerSource:
    'Source' name=ID;

// After <this | you | (x <allegiance> minions y)>, Whenever <this | you | (x <allegiance> minions y)>, TavernIsRefreshed
EventTrigger:
    time=('Whenever' | 'After') condition=Condition;

// EndOfTurn, StartOfTurn, StartOfCombat
SimpleTrigger:
    type=('Battlecry' | 'Deathrattle' | 'Rally' | 'StartOfTurn' | 'EndOfTurn' | 'StartOfCombat');

Condition:
    description=STRING;

Action:
    GainStatAction | GiveStatAction | SummonAction | DamageAction;

GainStatAction:
    'gain' StatModification;

GiveStatAction:
    'give' StatModification;

SummonAction:
    'summon' (amount=INT)? minion=[Minion];

DamageAction:
    'deal' amount=INT 'damage' 'to' target=Target;

StatModification:
    '+' attack=INT '/' '+' health=INT;

Owner returns string:
    'your' | 'tavern';

Target returns string:
    Owner Tribe's' | 'this';

Minion:
    'Minion' (token?='token')? name=ID '{'
        'name' minionName=STRING
        'tier' tier=INT
        'attack' attack=INT
        'health' health=INT
        ('tribes' tribes+=Tribe)?
        (keywords+=Keyword)*
        (effects+=Effect)*
    '}';

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
