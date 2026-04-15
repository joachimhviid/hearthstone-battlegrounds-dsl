grammar HearthstoneBattlegroundsDsl

entry Model:
    (tribes+=Tribe | bonusKeywords+=BonusKeyword | triggers+=Trigger | minions+=Minion)*;

// All, Beast, Demon, Dragon, Elemental, Mech, Murloc, Naga, Pirate, Quilboar, Undead
// Validate All is always alone (not combined with other tribes)
Tribe:
    'Tribe' name=ID;

// Divine Shield, Reborn, Stealth, Taunt, Venomous, or Windfury
BonusKeyword:
    'BonusKeyword' name=ID;

// this (current minion instance), you (player)
TriggerSource:
    'Source' name=ID;

// EndOfTurn, StartOfTurn, StartOfCombat, After <this | you | (x <allegiance> minions y)>, Whenever <this | you | (x <allegiance> minions y)>, TavernIsRefreshed
Trigger:
    'Trigger' name=ID;

Effect:
    triggers+=[Trigger] source=[TriggerSource];

StatModification:
    '+' attack=INT '/' '+' health=INT;

Minion:
    'Minion' name=ID '{'
        'name' minionName=STRING
        'tier' tier=TIER
        'attack' attack=INT
        'health' health=INT
        ('tribes' tribes+=[Tribe])?
    '}';

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal TIER returns number: /[1-6]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
