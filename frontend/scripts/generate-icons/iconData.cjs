/**
 * 文件名：iconData.js
 * 作者：开发者
 * 日期：2026-05-28
 * 版本：v1.1.0
 * 功能描述：图标数据定义——从设计规范文档提取的结构化数据
 * 更新记录：
 *   2026-05-28 - v1.0.0 - 初始创建
 *   2026-05-29 - v1.1.0 - 移除 uiBadges 中重复的 overlay_locked，避免重复生成
 */

const ICON_SIZE = '128x128';
const COMMON_STYLE = 'game icon, flat design with soft gradient, 2px dark outline stroke, top-left lighting, soft drop shadow, centered composition';

const CROP_QUALITY = {
  basic:   { bg: '#E8F5E9', border_glow: 'none',      bg_shape: 'rounded rectangle' },
  economic:{ bg: '#FFF3E0', border_glow: 'none',      bg_shape: 'rounded rectangle' },
  rare:    { bg: '#F3E5F5', border_glow: 'purple glow', bg_shape: 'rounded rectangle with dark pattern' },
  top:     { bg: '#FFFDE7', border_glow: 'rainbow gradient glow with rotating ring and holographic particles', bg_shape: 'rounded rectangle with golden pattern' }
};

const SEED_BAG = {
  basic:    { bag_color: '#F5F5DC cream',    rope: 'brown hemp rope', silhouette: 'dark green' },
  economic: { bag_color: '#FFF8DC light yellow', rope: 'red rope', silhouette: 'dark green' },
  rare:     { bag_color: '#E6E6FA light purple', rope: 'purple rope', silhouette: 'golden' },
  top:      { bag_color: '#FFFDE7 light gold',  rope: 'golden rope', silhouette: 'rainbow' }
};

/**
 * 获取作物品质分类
 */
function getCropQuality(cropId) {
  if (cropId <= 15) return 'basic';
  if (cropId <= 34) return 'economic';
  if (cropId <= 74) return 'rare';
  return 'top';
}

/**
 * 基础作物数据 (1-15)
 */
const basicCrops = [
  { id: 1,  name: '小麦',     visual: '3 golden yellow wheat ears, slightly bent',                           color: 'golden #FFD700 with #8B7355 stems' },
  { id: 2,  name: '玉米',     visual: 'corn cob with half-opened green husk revealing golden kernels',       color: 'golden #FFA500 with green #228B22' },
  { id: 3,  name: '青菜',     visual: 'top-down view of emerald green bok choy rosette',                    color: 'green #32CD32 with white core' },
  { id: 4,  name: '白菜',     visual: 'white-green napa cabbage with wrapped leaves',                       color: 'light green #9ACD32 with pure white' },
  { id: 5,  name: '土豆',     visual: '2 brown irregular oval potatoes with eye spots',                     color: 'brown #8B4513 with #654321 spots' },
  { id: 6,  name: '生菜',     visual: 'emerald green lettuce head with ruffled leaves',                     color: 'green #00FF7F with #228B22 edges' },
  { id: 7,  name: '胡萝卜',   visual: '2 orange conical carrots with green leafy tops',                     color: 'orange #FF6600 with green tops' },
  { id: 8,  name: '菠菜',     visual: 'bundle of dark green spinach with arrow-shaped leaves and red roots',color: 'dark green #006400 with red roots' },
  { id: 9,  name: '芹菜',     visual: 'green celery stalks, long and ribbed',                               color: 'green #00FF00 with white stalks' },
  { id: 10, name: '韭菜',     visual: 'bundle of dark green chive blades, thin and long',                   color: 'dark green #2E8B57' },
  { id: 11, name: '大豆',     visual: '3 plump green soybean pods with fuzz',                               color: 'olive green #556B2F with tan fuzz' },
  { id: 12, name: '番茄',     visual: '2 round glossy red tomatoes with green calyx',                       color: 'red #FF4500 with green stem' },
  { id: 13, name: '黄瓜',     visual: 'green long cucumber with bumpy texture',                             color: 'green #3CB371 with light spots' },
  { id: 14, name: '辣椒',     visual: '2 long curved red chili peppers with green stems',                   color: 'red #FF0000 with green stem' },
  { id: 15, name: '茄子',     visual: 'purple elongated eggplant with green calyx',                         color: 'purple #8B008B with green cap' }
];

/**
 * 经济作物数据 (16-34)
 */
const economicCrops = [
  { id: 16, name: '草莓',     visual: '3 red heart-shaped strawberries with golden seeds',                  color: 'crimson #DC143C with golden seeds' },
  { id: 17, name: '树莓',     visual: 'cluster of dark red aggregate raspberry drupelets',                  color: 'dark red #8B0000, textured' },
  { id: 18, name: '红莓',     visual: 'bright red aggregate berry cluster',                                 color: 'bright red #FF1493' },
  { id: 19, name: '西瓜',     visual: 'large round watermelon with dark green stripes',                      color: 'dark green #006400 with light green stripes' },
  { id: 20, name: '菠萝',     visual: 'yellow pineapple with green leaf crown and diamond scale pattern',   color: 'orange-yellow #FFA500 with brown scales' },
  { id: 21, name: '柚子',     visual: 'large round yellow pomelo fruit',                                    color: 'yellow #FFD700' },
  { id: 22, name: '柠檬',     visual: '2 yellow oval lemons with textured skin',                            color: 'yellow #FFFF00 with texture' },
  { id: 23, name: '葡萄',     visual: 'cluster of purple grapes',                                           color: 'purple #800080 with glossy highlights' },
  { id: 24, name: '荔枝',     visual: '3 red lychee fruits with scaly texture',                             color: 'red #FF6347 with dark red scales' },
  { id: 25, name: '龙眼',     visual: '5 yellowish-brown small round longan fruits',                        color: 'yellow-brown #D2691E' },
  { id: 26, name: '桃子',     visual: '2 pink heart-shaped peaches with cleft',                             color: 'pink #FFB6C1 with red cleft' },
  { id: 27, name: '李子',     visual: '2 purple-red round plums with white bloom',                          color: 'purple-red #8B008B with white frost' },
  { id: 28, name: '杏子',     visual: '2 orange-yellow small round apricots',                               color: 'orange #FFA500' },
  { id: 29, name: '梅子',     visual: '2 deep purple small round plums',                                    color: 'deep purple #4B0082' },
  { id: 30, name: '柿子',     visual: 'orange-red flat-round persimmon with green calyx',                   color: 'orange-red #FF4500 with green calyx' },
  { id: 31, name: '枣子',     visual: '3 red small oval jujube dates',                                      color: 'red #B22222' },
  { id: 32, name: '椰子',     visual: 'brown round coconut with fuzzy surface',                             color: 'brown #8B4513 with tan fuzz' },
  { id: 33, name: '芒果',     visual: 'yellow kidney-shaped mango with red blush',                          color: 'yellow #FFD700 with red blush' },
  { id: 34, name: '榴莲',     visual: 'large green spiky durian fruit',                                     color: 'olive green #556B2F with brown spikes' }
];

/**
 * 稀有作物数据 (35-74)
 */
const rareCrops = [
  { id: 35, name: '红毛丹',    visual: 'red hairy rambutan fruit',                                                    color: 'red with purple glow border' },
  { id: 36, name: '山竹',      visual: 'purple mangosteen with green calyx',                                          color: 'purple with purple glow' },
  { id: 37, name: '榴莲王',    visual: 'giant durian with golden crown emblem',                                        color: 'gold-green with golden glow' },
  { id: 38, name: '神秘果',    visual: 'glowing purple miracle fruit',                                                 color: 'purple with purple particles' },
  { id: 39, name: '诺丽果',    visual: 'yellow-green bumpy noni fruit',                                                color: 'yellow-green with soft glow' },
  { id: 40, name: '蓝莓',      visual: '5 small blue blueberries',                                                     color: 'blue with blue glow' },
  { id: 41, name: '蔓越莓',    visual: '5 small dark red cranberries',                                                 color: 'dark red with soft glow' },
  { id: 42, name: '黑莓',      visual: 'purple-black aggregate blackberry',                                            color: 'purple-black with dark glow' },
  { id: 43, name: '巴西莓',    visual: 'deep purple acai berry cluster',                                               color: 'deep purple with bright glow' },
  { id: 44, name: '枸杞',      visual: '5 red goji berries',                                                           color: 'red with soft glow' },
  { id: 45, name: '车厘子',    visual: '2 deep red large cherries',                                                    color: 'deep red with golden glow' },
  { id: 46, name: '桑葚',      visual: 'deep purple mulberry cluster',                                                 color: 'purple-black with blue glow' },
  { id: 47, name: '覆盆子',    visual: 'red raspberry aggregate fruit',                                                color: 'red with blue glow' },
  { id: 48, name: '醋栗',      visual: 'yellow small round gooseberries',                                              color: 'yellow with blue glow' },
  { id: 49, name: '越橘',      visual: 'blue-purple bilberry cluster',                                                 color: 'blue-purple with blue glow' },
  { id: 50, name: '仙人掌果',  visual: '2 red oval cactus fruits',                                                     color: 'red with blue glow' },
  { id: 51, name: '仙人果',    visual: '2 green oval cactus fruits',                                                   color: 'green with blue glow' },
  { id: 52, name: '黄龙果',    visual: 'golden spiky dragon fruit',                                                    color: 'golden with golden glow' },
  { id: 53, name: '红龙果',    visual: 'red spiky dragon fruit',                                                       color: 'red with golden glow' },
  { id: 54, name: '燕窝果',    visual: 'white spiky birds nest fruit',                                                 color: 'white with golden glow' },
  { id: 55, name: '天使果',    visual: 'glowing white fruit with angel wings',                                         color: 'white with golden sparkle particles' },
  { id: 56, name: '精灵果',    visual: 'glowing green fruit with pointed elf ears',                                    color: 'green with golden sparkle particles' },
  { id: 57, name: '仙果',      visual: 'glowing light pink fairy fruit with halo',                                     color: 'pink with golden sparkle particles' },
  { id: 58, name: '神果',      visual: 'glowing golden divine fruit with halo ring',                                   color: 'golden with golden sparkle particles' },
  { id: 59, name: '圣果',      visual: 'glowing white holy fruit with cross-shaped light',                              color: 'white with golden sparkle particles' },
  { id: 60, name: '龙果',      visual: 'glowing red dragon fruit with dragon scales',                                  color: 'red with golden sparkle particles' },
  { id: 61, name: '凤果',      visual: 'glowing orange phoenix fruit with phoenix tail feathers',                       color: 'orange with golden sparkle particles' },
  { id: 62, name: '麒麟果王',  visual: 'glowing yellow qilin king fruit with horn',                                     color: 'yellow with golden sparkle particles' },
  { id: 63, name: '凤凰果',    visual: 'glowing red-golden phoenix fruit with flames',                                  color: 'red-golden with golden sparkle particles' },
  { id: 64, name: '炼狱果',    visual: 'dark red blazing purgatory fruit with molten lava cracks',                      color: 'dark red with golden sparkle particles' },
  { id: 65, name: '地狱火果',  visual: 'burning red hellfire fruit with flames',                                        color: 'red with golden sparkle particles' },
  { id: 66, name: '暗影果',    visual: 'deep purple glowing shadow fruit with dark aura',                               color: 'deep purple with golden sparkle particles' },
  { id: 67, name: '深渊果',    visual: 'deep black glowing abyss fruit with swirling vortex',                           color: 'deep black with golden sparkle particles' },
  { id: 68, name: '混沌果',    visual: 'colorful spiral chaos fruit',                                                   color: 'multicolored with golden sparkle particles' },
  { id: 69, name: '虚空果',    visual: 'purple-black glowing void fruit with hollow center',                            color: 'purple-black with golden sparkle particles' },
  { id: 70, name: '星陨果',    visual: 'meteorite-shaped glowing fruit',                                                color: 'iron metallic with golden sparkle particles' },
  { id: 71, name: '星辉果',    visual: 'twinkling starlight silver fruit',                                              color: 'silver with golden sparkle particles' },
  { id: 72, name: '星河果',    visual: 'blue fruit with galaxy pattern',                                                color: 'blue with golden sparkle particles' },
  { id: 73, name: '星际果',    visual: 'interstellar space blue fruit with planet pattern',                             color: 'space blue with golden sparkle particles' },
  { id: 74, name: '宇宙果',    visual: 'deep purple cosmos fruit with galaxy pattern',                                  color: 'deep purple with golden sparkle particles' }
];

/**
 * 顶级作物数据 (75-84)
 */
const topCrops = [
  { id: 75, name: '创世纪果',  visual: 'golden glowing genesis fruit with creation light',                              color: 'golden, rainbow gradient glow halo, rotating ring, holographic particles' },
  { id: 76, name: '初始果',    visual: 'pure white glowing primordial fruit with raw energy',                           color: 'pure white, rainbow gradient glow halo, rotating ring, holographic particles' },
  { id: 77, name: '起源果',    visual: 'blue-white glowing origin fruit with creation power',                           color: 'blue-white, rainbow gradient glow halo, rotating ring, holographic particles' },
  { id: 78, name: '太初果',    visual: 'fruit with glowing yin-yang taiji symbol',                                      color: 'black-white taiji, rainbow gradient glow halo, rotating ring, holographic particles' },
  { id: 79, name: '元始果',    visual: 'golden glowing fruit with primordial runes',                                    color: 'golden, rainbow gradient glow halo, rotating ring, holographic particles' },
  { id: 80, name: '永恒果',    visual: 'silver fruit surrounded by infinity loop rings',                                color: 'silver, rainbow gradient glow halo, rotating ring, holographic particles' },
  { id: 81, name: '终焉果',    visual: 'apocalyptic judgment-style glowing fruit',                                      color: 'dark and light contrast, rainbow gradient glow halo, rotating ring, holographic particles' },
  { id: 82, name: '毁灭果',    visual: 'black core fruit with flame cracks',                                            color: 'black core with red flames, rainbow gradient glow halo, rotating ring, holographic particles' },
  { id: 83, name: '重生果',    visual: 'phoenix rebirth-style glowing fruit',                                           color: 'phoenix fire colors, rainbow gradient glow halo, rotating ring, holographic particles' },
  { id: 84, name: '永恒圣果',  visual: 'ultimate divine glowing fruit with six angel wings',                            color: 'divine light, rainbow gradient glow halo, rotating ring, holographic particles' }
];

/**
 * 道具数据 (1-20)
 */
const items = [
  { id: 1,  name: '初级增产剂',   form: 'round-bottom flask with green liquid and upward arrow 1 label',        color: 'green liquid in clear glass', bg: 'circular #EEEEEE' },
  { id: 2,  name: '中级增产剂',   form: 'erlenmeyer flask with blue liquid and upward arrow 2 label',           color: 'blue liquid in clear glass', bg: 'circular #EEEEEE' },
  { id: 3,  name: '高级增产剂',   form: 'reagent bottle with purple liquid and upward arrow 3 label',           color: 'purple liquid in clear glass', bg: 'circular #EEEEEE' },
  { id: 4,  name: '初级加速剂',   form: 'round-bottom flask with yellow liquid and lightning bolt 1 label',     color: 'yellow liquid in clear glass', bg: 'circular #EEEEEE' },
  { id: 5,  name: '中级加速剂',   form: 'erlenmeyer flask with orange liquid and lightning bolt 2 label',       color: 'orange liquid in clear glass', bg: 'circular #EEEEEE' },
  { id: 6,  name: '高级加速剂',   form: 'reagent bottle with red liquid and lightning bolt 3 label',            color: 'red liquid in clear glass', bg: 'circular #EEEEEE' },
  { id: 7,  name: '超级增产剂',   form: 'golden holy grail chalice with golden liquid and radiant arrow up',    color: 'golden liquid, golden chalice', bg: 'circular #EEEEEE' },
  { id: 8,  name: '超级加速剂',   form: 'golden hourglass bottle with flowing golden sand and lightning bolt',  color: 'golden sand in clear glass', bg: 'circular #EEEEEE' },
  { id: 9,  name: '幸运种子',     form: 'glowing four-leaf clover with sparkle stars',                           color: 'emerald green, golden sparkles', bg: 'circular #EEEEEE' },
  { id: 10, name: '时光沙漏',     form: 'classic hourglass with golden frame and blue sand',                    color: 'golden frame, blue sand', bg: 'circular #EEEEEE' },
  { id: 11, name: '丰收之神',     form: 'golden cornucopia horn overflowing with fruits',                        color: 'golden horn, colorful fruits', bg: 'circular #EEEEEE' },
  { id: 12, name: '土地祝福',     form: 'glowing parchment scroll with sparkle light effect',                   color: 'brown parchment with golden glow', bg: 'circular #EEEEEE' },
  { id: 13, name: '经验药水',     form: 'triangular erlenmeyer flask with blue liquid and star label',          color: 'blue liquid in clear glass', bg: 'circular #EEEEEE' },
  { id: 14, name: '金币袋',       form: 'brown sack bag overflowing with gold coins',                            color: 'brown bag, golden coins', bg: 'circular #EEEEEE' },
  { id: 15, name: '神秘宝箱',     form: 'purple treasure chest with golden trim and question mark',              color: 'purple with golden edges', bg: 'circular #EEEEEE' },
  { id: 16, name: '农场手册',     form: 'open book with green cover and house icon',                             color: 'green cover book', bg: 'circular #EEEEEE' },
  { id: 17, name: '世界之书',     form: 'open book with blue cover and globe icon',                              color: 'blue cover book', bg: 'circular #EEEEEE' },
  { id: 18, name: '体力药水',     form: 'small round bottle with red liquid and heart icon',                    color: 'red liquid in clear glass', bg: 'circular #EEEEEE' },
  { id: 19, name: '高级体力药水', form: 'medium round bottle with deep red liquid and heart plus icon',         color: 'deep red liquid in clear glass', bg: 'circular #EEEEEE' },
  { id: 20, name: '超级体力药水', form: 'large round bottle with golden liquid and heart up icon',              color: 'golden liquid in clear glass', bg: 'circular #EEEEEE' }
];

/**
 * 土地图标数据 (1-8)
 */
const lands = [
  { id: 1,  name: '普通', visual: 'brown soil texture, rustic, small grass',                              color: '#8B4513', border: '#654321', texture: 'soil particles' },
  { id: 2,  name: '铜',   visual: 'copper metallic soil with patina border',                               color: '#CD7F32', border: '#8B6508', texture: 'copper verdigris' },
  { id: 3,  name: '铁',   visual: 'silver-gray metallic soil with rivet border',                           color: '#71797E', border: '#4A4A4A', texture: 'brushed metal' },
  { id: 4,  name: '金',   visual: 'golden shining soil with gem-embedded border',                           color: '#FFD700', border: '#DAA520', texture: 'polished mirror' },
  { id: 5,  name: '翡翠', visual: 'emerald green jade soil with vine border',                               color: '#50C878', border: '#2E8B57', texture: 'translucent jade' },
  { id: 6,  name: '钻石', visual: 'light blue diamond soil with cut facets and refraction',                 color: '#B9F2FF', border: '#87CEEB', texture: 'diamond facets refraction' },
  { id: 7,  name: '狱',   visual: 'dark red hell lava soil with flame border and molten cracks',            color: '#8B0000', border: '#FF4500', texture: 'flowing lava' },
  { id: 8,  name: '无尽', visual: 'purple-black endless void soil with rotating galaxy border and stars',   color: '#9400D3', border: '#191970', texture: 'starry void particles' }
];

/**
 * UI按钮数据 (1-7)
 */
const uiButtons = [
  { name: 'plant',     visual: 'shovel with a seed, warm brown circular background, white icon', size: '64x64' },
  { name: 'harvest',   visual: 'basket with fruit, warm brown circular background, white icon', size: '64x64' },
  { name: 'water',     visual: 'water drop with watering can, warm brown circular background, white icon', size: '64x64' },
  { name: 'fertilize', visual: 'fertilizer bag, warm brown circular background, white icon', size: '64x64' },
  { name: 'shop',      visual: 'shopping cart or storefront, warm brown circular background, white icon', size: '64x64' },
  { name: 'bag',       visual: 'backpack bag, warm brown circular background, white icon', size: '64x64' },
  { name: 'upgrade',   visual: 'upward arrow with star, warm brown circular background, white icon', size: '64x64' }
];

/**
 * UI面板数据 (1-4)
 */
const uiPanels = [
  { name: 'main_bg',      visual: 'wooden textured panel background',                            size: '512x512' },
  { name: 'crop_detail',  visual: 'green themed bordered panel with rounded corners',             size: '400x600' },
  { name: 'item_detail',  visual: 'gray themed bordered panel with rounded corners',              size: '400x600' },
  { name: 'shop_bg',      visual: 'golden themed bordered panel with rounded corners',            size: '512x512' }
];

/**
 * UI通用元素数据 (1-12)
 */
const uiCommon = [
  { name: 'icon_gold',          visual: 'golden round coin with dollar sign',                      size: '32x32' },
  { name: 'icon_exp',           visual: 'blue star shape for experience points',                   size: '32x32' },
  { name: 'icon_energy',        visual: 'red heart shape with lightning bolt for energy',           size: '32x32' },
  { name: 'icon_seed',          visual: 'small cloth seed pouch bag',                               size: '32x32' },
  { name: 'bar_green',          visual: 'green horizontal gradient progress bar',                   size: '256x16' },
  { name: 'bar_yellow',         visual: 'golden horizontal gradient progress bar',                  size: '256x16' },
  { name: 'frame_slot',         visual: 'gray square item slot frame with inner recess',            size: '72x72' },
  { name: 'frame_slot_selected',visual: 'golden highlighted square item slot frame',                size: '72x72' },
  { name: 'frame_land_empty',   visual: 'dashed border empty soil plot frame',                      size: '96x96' },
  { name: 'particle_sparkle',   visual: 'white four-pointed star sparkle particle',                 size: '16x16' },
  { name: 'particle_leaf',      visual: 'green falling leaf particle',                              size: '16x16' },
  { name: 'overlay_locked',     visual: 'semi-transparent black overlay with lock icon',            size: '96x96' }
];

/**
 * UI徽章数据 (1种)
 * 注意: overlay_locked 已合并到 uiCommon，避免重复生成
 */
const uiBadges = [
  { name: 'badge_quality', visual: 'circular quality badge base plate',                              size: '48x48' }
];

/**
 * 获取所有图标生成任务
 */
function getAllTasks() {
  const tasks = [];

  const allCrops = [...basicCrops, ...economicCrops, ...rareCrops, ...topCrops];

  allCrops.forEach(crop => {
    tasks.push({
      type: 'crop',
      id: crop.id,
      filename: `crop_${crop.id}.jpg`,
      outputDir: 'icons/crops',
      data: crop
    });
    tasks.push({
      type: 'seed',
      id: crop.id,
      filename: `seed_${crop.id}.jpg`,
      outputDir: 'icons/seeds',
      data: crop
    });
  });

  items.forEach(item => {
    tasks.push({
      type: 'item',
      id: item.id,
      filename: `item_${item.id}.jpg`,
      outputDir: 'icons/items',
      data: item
    });
  });

  lands.forEach(land => {
    tasks.push({
      type: 'land',
      id: land.id,
      filename: `land_${land.id}.jpg`,
      outputDir: 'icons/land',
      data: land
    });
  });

  uiButtons.forEach(btn => {
    tasks.push({
      type: 'ui_button',
      id: btn.name,
      filename: `ui_button_${btn.name}.jpg`,
      outputDir: 'ui/buttons',
      data: btn
    });
  });

  uiPanels.forEach(panel => {
    tasks.push({
      type: 'ui_panel',
      id: panel.name,
      filename: `ui_panel_${panel.name}.jpg`,
      outputDir: 'ui/panels',
      data: panel
    });
  });

  uiCommon.forEach(el => {
    tasks.push({
      type: 'ui_common',
      id: el.name,
      filename: `ui_${el.name}.jpg`,
      outputDir: 'ui/common',
      data: el
    });
  });

  uiBadges.forEach(badge => {
    tasks.push({
      type: 'ui_common',
      id: badge.name,
      filename: `ui_${badge.name}.jpg`,
      outputDir: 'ui/common',
      data: badge
    });
  });

  return tasks;
}

module.exports = {
  ICON_SIZE,
  COMMON_STYLE,
  CROP_QUALITY,
  SEED_BAG,
  getCropQuality,
  basicCrops,
  economicCrops,
  rareCrops,
  topCrops,
  items,
  lands,
  uiButtons,
  uiPanels,
  uiCommon,
  uiBadges,
  getAllTasks
};