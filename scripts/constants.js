const MODULE = `pf2e-actor-refresh-utility`;
const CLASS = `ActorRefreshUtility`;
const GARBO = `<garbage provided>`;
const PHYSICAL_ITEM_TYPES = ["armor", "backpack", "book", "consumable", "equipment", "shield", "treasure", "weapon"];
const LABELS = {
  army: "TYPES.Actor.army",
  character: "TYPES.Actor.character",
  familiar: "TYPES.Actor.familiar",
  hazard: "TYPES.Actor.hazard",
  loot: "TYPES.Actor.loot",
  npc: "TYPES.Actor.npc",
  party: "TYPES.Actor.party",
  vehicle: "TYPES.Actor.vehicle",
  action: "PF2E.ActionActionsLabel",
  ancestry: "TYPES.Item.ancestry",
  background: "TYPES.Item.background",
  backup: "SETUP.BACKUPS.Backup",
  class: "TYPES.Item.class",
  dance: "ARU.RefreshOptionsDialog.Dance",
  feat: "PF2E.Item.Feat.Plural",
  heritage: "TYPES.Item.heritage",
  inventory: "PF2E.TabInventoryLabel",
  items: "PF2E.Item.Plural",
  spell: "PF2E.Item.Spell.Plural",
};

const REFRESH_OPTIONS = {
  character: {
    ancestry: true,
    background: true,
    heritage: true,
    class: true,
    action: true,
    inventory: true,
    feat: true,
    spell: true,
    dance: true,
  },
  familiar: {
    ancestry: false,
    background: false,
    heritage: false,
    class: false,
    action: true,
    inventory: false,
    feat: false,
    spell: false,
    dance: false,
  },
  npc: {
    ancestry: false,
    background: false,
    heritage: false,
    class: false,
    action: true,
    inventory: true,
    feat: false,
    spell: true,
    dance: false,
  },
  party: {
    ancestry: false,
    background: false,
    heritage: false,
    class: false,
    action: false,
    inventory: true,
    feat: false,
    spell: false,
    dance: false,
  },
  hazard: {
    ancestry: false,
    background: false,
    heritage: false,
    class: false,
    action: true,
    inventory: false,
    feat: false,
    spell: false,
    dance: false,
  },
  loot: {
    ancestry: false,
    background: false,
    heritage: false,
    class: false,
    action: false,
    inventory: true,
    feat: false,
    spell: false,
    dance: false,
  },
  vehicle: {
    ancestry: false,
    background: false,
    heritage: false,
    class: false,
    action: false,
    inventory: true,
    feat: false,
    spell: false,
    dance: false,
  },
};
export { MODULE, CLASS, GARBO, REFRESH_OPTIONS, PHYSICAL_ITEM_TYPES, LABELS };
