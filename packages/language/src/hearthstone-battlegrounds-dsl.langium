grammar HearthstoneBattlegroundsDsl

entry Model:
    (minions+=Minion)*;

// -------------------------------- BASE

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

// Validate 'All' is always alone (not combined with other tribes)
Tribe returns string:
    'All' | 'Beast' | 'Demon' | 'Dragon' | 'Elemental' | 'Mech' | 'Murloc' | 'Naga' | 'Pirate' | 'Quilboar' | 'Undead';

// Divine Shield, Reborn, Stealth, Taunt, Venomous, or Windfury
Keyword returns string:
    'Taunt' | 'Reborn' | 'DivineShield' | 'Stealth' | 'Windfury' | 'Venomous';

// -------------------------------- EFFECTS & TRIGGERS

Effect:
    trigger=Trigger actions+=Action ('and' actions+=Action)* (modifier=Modifier)?;

Modifier returns string:
    'permanently' | 'this combat' | 'this game' | 'this turn' | 'until next turn';

Trigger:
    SimpleTrigger | EventTrigger;

EventTrigger:
    time=('Whenever' | 'After') condition=Condition;

SimpleTrigger:
    type=('Battlecry' | 'Deathrattle' | 'Rally' | 'Start of Turn' | 'End of Turn' | 'Start of Combat');


// -------------------------------- CONDITIONS

Condition:
    PlayerActionCondition | MinionActionCondition;

PlayerActionCondition:
    PlayerPlayCondition | PlayerTriggerKeywordCondition | PlayerSellCondition;

PlayerPlayCondition:
    'you' action=('play' | 'cast' | 'summon' | 'overflow') target=Target;

PlayerTriggerKeywordCondition:
    'you trigger a' keyword=Keyword;

PlayerSellCondition:
    'you sell' target=Target;

MinionActionCondition:
    MinionDamageCondition | MinionStatGainCondition;

MinionDamageCondition:
    target=Target 'takes damage';

MinionStatGainCondition:
    target=Target 'gains' stat=('attack' | 'health');

// -------------------------------- ACTIONS

Action:
    GainStatAction | GrantAttributeAction | SummonAction | DamageAction | GetMinionAction;

GainStatAction:
    'gain' StatModification;

GetMinionAction:
    'get' amount=INT (random?='random')? subject=Target;

KeywordModification:
    keyword=Keyword;

AttributeModification:
    StatModification | KeywordModification;

GrantAttributeAction:
    'give' target=Target '(' modifications+=AttributeModification (',' modifications+=AttributeModification)* ')';

SummonAction:
    'summon' (amount=INT)? minion=[Minion];

DamageAction:
    'deal' amount=INT 'damage to' target=Target;

StatModification:
    '+' attack=INT '/' '+' health=INT;


// -------------------------------- SELECTORS

Affiliation returns string:
    'tavern' | 'friendly' | 'enemy';

TargetQuantifier:
    one?=('a' | 'an') | all?='all' (excludeSelf?='other')? | another?='another';

Target:
    ExplicitTarget | DynamicTarget;
    // 'this' | (quantifier=TargetQuantifier)? (affiliation=Affiliation)? (tribe=Tribe)? (keyword=Keyword)?;

ExplicitTarget:
    'this' | 'it' | (affiliation=Affiliation)? target=('minion' | Tribe);

DynamicTarget:
    quantifier=TargetQuantifier (affiliation=Affiliation)? target=('minion' | Tribe);


hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
