const fu = foundry.utils;
const MODULE = `pf2e-actor-refresh-utility`;

class ActorRefreshUtility extends FormApplication {
  static get defaultOptions() {
    return fu.mergeObject(super.defaultOptions,{
      template: `modules/${MODULE}/templates/aru-main.hbs`,
      title: `Actor Refresh Utility`,
      id: `actor-refresh-utility`,
    });
  }
}