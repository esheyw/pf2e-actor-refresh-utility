import { ActorRefreshUtility } from "./ActorRefreshUtility.js";
const MODULE = `pf2e-actor-refresh-utility`;
Hooks.once("init", () => {
  game.aru = {
    class: ActorRefreshUtility,
  };
});
Hooks.once("setup", () => {
  Handlebars.registerHelper({
    eq: (v1, v2) => v1 === v2,
    ne: (v1, v2) => v1 !== v2,
    lt: (v1, v2) => v1 < v2,
    gt: (v1, v2) => v1 > v2,
    lte: (v1, v2) => v1 <= v2,
    gte: (v1, v2) => v1 >= v2,
    and() {
        return Array.prototype.every.call(arguments, Boolean);
    },
    or() {
        return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
    },
    in: (obj,key) => key in obj,
  });
  Handlebars.registerPartial('folderStructureOptions', `<option value=""></option>
  {{#each folders}}
  <option value="{{id}}">{{name}}</option>
  {{/each}}`);
});