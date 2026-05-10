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

// After <this | you | (x <allegiance> minions y)>, Whenever <this | you | (x <allegiance> minions y)>, TavernIsRefreshed
EventTrigger:
    time=('Whenever' | 'After') condition=Condition;

// EndOfTurn, StartOfTurn, StartOfCombat
SimpleTrigger:
    type=('Battlecry' | 'Deathrattle' | 'Rally' | 'StartOfTurn' | 'EndOfTurn' | 'StartOfCombat');

// minion (of tribe) played
Condition:
    PlayerActionCondition | MinionActionCondition;

PlayerActionCondition:
    PlayerPlayCondition;

MinionActionCondition:;

PlayerPlayCondition:
    'you' action=('play' | 'cast' | 'summon' | 'overflow') subject=CardSelector;
    // 'a' minionType=('minion' | Tribe) 'is' summonType=('played' | 'summoned');

CardSelector:;

Action:
    GainStatAction | GrantAttributeAction | SummonAction | DamageAction;

GainStatAction:
    'gain' StatModification;

KeywordModification:
    keyword=Keyword;

AttributeModification:
    StatModification | KeywordModification;

GrantAttributeAction:
    'give' target=Target '(' modifications+=AttributeModification (',' modifications+=AttributeModification)* ')';

SummonAction:
    'summon' (amount=INT)? minion=[Minion];

DamageAction:
    'deal' amount=INT 'damage' 'to' target=Target;

StatModification:
    '+' attack=INT '/' '+' health=INT;

Owner returns string:
    'tavern' | 'friendly' | 'enemy';

Quantifier:
    'a' | 'all' (excludeSelf?='other')?;

Target:
    'this' | quantifier=Quantifier (owner=Owner)? (tribe=Tribe)?;

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
