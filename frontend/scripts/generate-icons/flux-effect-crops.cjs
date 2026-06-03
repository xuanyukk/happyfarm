/**
 * 文件名：flux-effect-crops.cjs
 * 作者：开发者
 * 日期：2026-05-28
 * 版本：v1.0.0
 * 功能描述：FLUX特效作物数据——稀有/顶级作物的生长阶段与成品图标结构化设计数据
 * 更新记录：
 *   2026-05-28 - v1.0.0 - 初始创建，覆盖稀有作物(35-74)和顶级作物(75-84)
 *
 * 特效分类：
 *   稀有 (35-44): 紫色光晕 + 紫色星星粒子
 *   稀有+ (45-54): 蓝色光晕 + 蓝色光点
 *   极稀有 (55-74): 金色光晕 + 金色流光粒子
 *   顶级 (75-84): 彩虹渐变光晕 + 旋转光环 + 全息粒子
 */

const EFFECT_PRESETS = {
  rare_purple: {
    glow: 'soft purple glow (#9400D3), luminous purple aura',
    particles: 'floating purple star particles, tiny sparkling purple light dots',
    border: 'subtle purple glow border',
    stageLight: 'purple light beam, violet ethereal energy'
  },
  rare_blue: {
    glow: 'soft blue glow (#4169E1), luminous blue aura',
    particles: 'floating blue light dots, tiny sparkling blue particles',
    border: 'subtle blue glow border',
    stageLight: 'blue light beam, cyan ethereal energy'
  },
  super_rare_golden: {
    glow: 'radiant golden glow (#FFD700), luminous golden aura, divine light',
    particles: 'floating golden sparkle particles, golden flowing light streaks, shimmering gold dust',
    border: 'bright golden glow border',
    stageLight: 'golden light beam, brilliant golden energy column'
  },
  top_rainbow: {
    glow: 'rainbow gradient glow halo, prismatic light, rainbow chromatic aberration',
    particles: 'holographic shimmer particles, iridescent floating light fragments, rainbow sparkle dust',
    border: 'rainbow gradient rotating glow border, prismatic edge light',
    stageLight: 'rainbow gradient light column, holographic energy beam, prismatic light rays',
    ring: 'rotating energy ring, spinning light halo band, orbiting golden ring'
  }
};

function getEffectPreset(cropId) {
  if (cropId <= 44) return EFFECT_PRESETS.rare_purple;
  if (cropId <= 54) return EFFECT_PRESETS.rare_blue;
  if (cropId <= 74) return EFFECT_PRESETS.super_rare_golden;
  return EFFECT_PRESETS.top_rainbow;
}

function getQualityLabel(cropId) {
  if (cropId <= 44) return '稀有';
  if (cropId <= 54) return '稀有+';
  if (cropId <= 74) return '极稀有';
  return '顶级';
}

const rareCrops_35_44 = [
  { id: 35, name: '红毛丹', enName: 'Rambutan',
    stage1: 'tiny glowing purple sprout emerging from dark soil, single luminous purple shoot',
    stage2: 'small plant with glowing purple-tinged leaves, faint purple light aura around the seedling',
    stage3: 'growing bush with luminous purple flower buds, purple energy particles floating around',
    stage4: 'branches bearing small red spiky rambutan fruits with purple glow outline, purple star particles',
    stage5: 'full red hairy rambutan fruit with bright purple glow halo, floating purple sparkle particles, golden maturity star mark',
    product: 'red hairy rambutan fruit with scaly texture, purple glow border, purple star particles, rounded rectangle purple-tinted backing'
  },
  { id: 36, name: '山竹', enName: 'Mangosteen',
    stage1: 'tiny glowing purple sprout with violet light dot emerging from soil',
    stage2: 'young plant with broad dark leaves, soft purple luminescence around stem',
    stage3: 'small tree with purple-glowing white flower buds, violet particles drifting',
    stage4: 'tree bearing small dark purple mangosteens with green calyx, purple glow aura',
    stage5: 'ripe purple mangosteen with green calyx, bright purple glow halo, floating purple star particles, golden star mark',
    product: 'purple mangosteen fruit with green leaf calyx, purple glow border, purple star particles, rounded rectangle purple-tinted backing'
  },
  { id: 37, name: '榴莲王', enName: 'King Durian',
    stage1: 'golden-green glowing sprout with crown-shaped first leaf emerging from soil',
    stage2: 'young plant with spiky-edged leaves, golden-green luminescence',
    stage3: 'growing plant with golden-glowing flower buds, crown emblem forming in light',
    stage4: 'large spiky durian fruit with golden crown emblem above, golden-green glow particles',
    stage5: 'giant golden-green durian with radiant golden crown emblem, bright golden-purple glow halo, floating star particles, golden star mark',
    product: 'giant durian with golden crown emblem, golden-green glow border, star particles, rounded rectangle golden-tinted backing'
  },
  { id: 38, name: '神秘果', enName: 'Miracle Fruit',
    stage1: 'mysterious glowing purple light orb emerging from dark soil',
    stage2: 'ethereal plant with translucent purple-veined leaves, mysterious purple mist',
    stage3: 'glowing purple orb flowers with question-mark-shaped petals, swirling purple energy',
    stage4: 'glowing purple miracle fruits forming within purple light orbs, purple particle vortex',
    stage5: 'bright glowing purple miracle fruit radiating mystery energy, purple glow halo, swirling purple star particles, golden star mark',
    product: 'glowing purple miracle fruit with question-mark emblem, purple glow border, swirling purple particles, rounded rectangle purple-tinted backing'
  },
  { id: 39, name: '诺丽果', enName: 'Noni Fruit',
    stage1: 'small yellow-green sprout with soft natural glow emerging from soil',
    stage2: 'broad-leafed plant with yellow-green luminescent veins, gentle glow',
    stage3: 'white flower clusters with yellow-green glowing centers, soft light particles',
    stage4: 'bumpy yellow-green noni fruits forming, soft natural glow around each fruit',
    stage5: 'ripe yellow-green bumpy noni fruit with soft golden glow halo, floating light particles, golden star mark',
    product: 'yellow-green bumpy noni fruit, soft golden glow border, light particles, rounded rectangle golden-tinted backing'
  },
  { id: 40, name: '蓝莓', enName: 'Blueberry',
    stage1: 'small blue-tinged sprout with blue light spark emerging from soil',
    stage2: 'low bush with small blue-green leaves, subtle blue luminescence',
    stage3: 'bush with tiny white bell flowers, blue glowing pollen particles',
    stage4: 'bush bearing small blue berries with frosty bloom, blue glow particles around each berry',
    stage5: 'cluster of 5 plump blue blueberries with blue glow halo, floating blue star particles, golden star mark',
    product: '5 small blue blueberries with frost, blue glow border, blue star particles, rounded rectangle blue-tinted backing'
  },
  { id: 41, name: '蔓越莓', enName: 'Cranberry',
    stage1: 'tiny red-tinted sprout emerging from soil with crimson light',
    stage2: 'low creeping vine with small dark leaves, subtle red luminescence',
    stage3: 'vine with pink flower buds, soft red glowing pollen',
    stage4: 'vine bearing small dark red cranberries, red glow particles around fruits',
    stage5: '5 ripe dark red cranberries with crimson glow halo, floating red star particles, golden star mark',
    product: '5 small dark red cranberries, crimson glow border, red star particles, rounded rectangle red-tinted backing'
  },
  { id: 42, name: '黑莓', enName: 'Blackberry',
    stage1: 'dark purple sprout with deep purple light emerging from soil',
    stage2: 'thorny cane with dark purple-green leaves, subtle dark luminescence',
    stage3: 'cane with white-pink flowers, dark purple pollen particles',
    stage4: 'cane bearing purple-black aggregate blackberries, dark purple glow aura',
    stage5: 'ripe purple-black aggregate blackberry with dark purple glow halo, floating purple-black star particles, golden star mark',
    product: 'purple-black aggregate blackberry, dark purple glow border, purple-black particles, rounded rectangle purple-tinted backing'
  },
  { id: 43, name: '巴西莓', enName: 'Acai Berry',
    stage1: 'deep purple sprout with bright purple light dot emerging from soil',
    stage2: 'palm-like young plant with deep purple-tinged fronds, bright luminescence',
    stage3: 'plant with purple flower clusters, bright purple glowing pollen',
    stage4: 'clusters of small deep purple acai berries, bright purple glow around each cluster',
    stage5: 'deep purple acai berry cluster with bright purple glow halo, floating bright purple star particles, golden star mark',
    product: 'deep purple acai berry cluster, bright purple glow border, bright purple particles, rounded rectangle purple-tinted backing'
  },
  { id: 44, name: '枸杞', enName: 'Goji Berry',
    stage1: 'small red sprout with warm red light emerging from soil',
    stage2: 'shrub with small elongated leaves, soft red luminescence on branches',
    stage3: 'shrub with purple-white flowers, warm red glowing pollen',
    stage4: 'shrub bearing small red goji berries, red glow aura around each berry',
    stage5: '5 bright red goji berries with warm red glow halo, floating red star particles, golden star mark',
    product: '5 red goji berries, warm red glow border, red star particles, rounded rectangle red-tinted backing'
  }
];

const rarePlusCrops_45_54 = [
  { id: 45, name: '车厘子', enName: 'Cherry',
    stage1: 'blue-glowing sprout with golden light accent emerging from soil',
    stage2: 'young tree with blue-luminous leaves, soft golden-blue aura',
    stage3: 'tree with pink-white blossoms, blue light particles drifting among flowers',
    stage4: 'tree bearing deep red cherries with blue glow outline, golden-blue particles',
    stage5: '2 large deep red cherries with golden-blue glow halo, floating blue light particles, golden star mark',
    product: '2 deep red large cherries with stems, golden glow border, blue light particles, rounded rectangle blue-tinted backing'
  },
  { id: 46, name: '桑葚', enName: 'Mulberry',
    stage1: 'deep purple sprout with blue light spark emerging from soil',
    stage2: 'tree with broad heart-shaped leaves, blue luminescent veins',
    stage3: 'tree with catkin flowers, blue glowing pollen threads',
    stage4: 'tree bearing purple-black mulberry clusters with blue glow outline, floating blue dots',
    stage5: 'deep purple mulberry cluster with blue-purple glow halo, floating blue light particles, golden star mark',
    product: 'deep purple mulberry cluster, blue-purple glow border, blue light particles, rounded rectangle blue-tinted backing'
  },
  { id: 47, name: '覆盆子', enName: 'Raspberry',
    stage1: 'red sprout with blue light aura emerging from soil',
    stage2: 'thorny cane with blue-luminous leaf edges, subtle red-blue glow',
    stage3: 'cane with white flowers, blue and red mixed glowing pollen',
    stage4: 'cane bearing red raspberry aggregate fruits with blue glow particles',
    stage5: 'ripe red raspberry aggregate fruit with blue-red glow halo, floating blue light particles, golden star mark',
    product: 'red raspberry aggregate fruit, blue glow border, blue light particles, rounded rectangle blue-tinted backing'
  },
  { id: 48, name: '醋栗', enName: 'Gooseberry',
    stage1: 'yellow-green sprout with blue light spark emerging from soil',
    stage2: 'thorny bush with veined leaves, subtle blue-green luminescence',
    stage3: 'bush with small bell flowers, blue glowing pollen',
    stage4: 'bush bearing small yellow translucent gooseberries with blue glow outline',
    stage5: 'ripe yellow round gooseberries with blue-golden glow halo, floating blue light particles, golden star mark',
    product: 'yellow small round gooseberries, blue glow border, blue light particles, rounded rectangle blue-tinted backing'
  },
  { id: 49, name: '越橘', enName: 'Bilberry',
    stage1: 'blue-purple sprout with bright blue light emerging from soil',
    stage2: 'low shrub with small oval leaves, blue-purple luminescent edges',
    stage3: 'shrub with pink bell flowers, bright blue glowing pollen',
    stage4: 'shrub bearing blue-purple bilberries with frost, blue glow particles around each berry',
    stage5: 'blue-purple bilberry cluster with bright blue glow halo, floating blue light particles, golden star mark',
    product: 'blue-purple bilberry cluster, bright blue glow border, blue light particles, rounded rectangle blue-tinted backing'
  },
  { id: 50, name: '仙人掌果', enName: 'Cactus Fruit',
    stage1: 'red-tinted cactus pad sprout with blue light spark from sandy soil',
    stage2: 'small prickly pear cactus with blue-luminous spine tips, subtle glow',
    stage3: 'cactus with red flower buds on pad edges, blue glowing pollen',
    stage4: 'cactus bearing red oval fruits on pad edges with blue glow outline',
    stage5: '2 ripe red oval cactus fruits with blue-red glow halo, floating blue light particles, golden star mark',
    product: '2 red oval cactus fruits, blue glow border, blue light particles, rounded rectangle blue-tinted backing'
  },
  { id: 51, name: '仙人果', enName: 'Cactus Fig',
    stage1: 'green cactus pad sprout with blue light emerging from sandy soil',
    stage2: 'small prickly pear with blue-luminous green pads, subtle cyan glow',
    stage3: 'cactus with yellow-green flower buds, blue glowing pollen particles',
    stage4: 'cactus bearing green oval fruits with blue glow outline, blue light dots',
    stage5: '2 ripe green oval cactus fruits with blue-cyan glow halo, floating blue light particles, golden star mark',
    product: '2 green oval cactus fruits, blue glow border, blue light particles, rounded rectangle blue-tinted backing'
  },
  { id: 52, name: '黄龙果', enName: 'Golden Dragon Fruit',
    stage1: 'golden glowing sprout with blue light spark from soil',
    stage2: 'climbing cactus with golden-luminous ribbed stems, blue-green glow',
    stage3: 'cactus with large white night-blooming flowers, golden-blue glowing pollen',
    stage4: 'golden spiky dragon fruit forming with blue glow outline, golden-blue particles',
    stage5: 'ripe golden spiky dragon fruit with golden-blue glow halo, floating blue light and golden particles, golden star mark',
    product: 'golden spiky dragon fruit, golden glow border, blue light particles, rounded rectangle golden-blue backing'
  },
  { id: 53, name: '红龙果', enName: 'Red Dragon Fruit',
    stage1: 'red glowing sprout with blue light spark from soil',
    stage2: 'climbing cactus with red-luminous ribbed stems, subtle blue glow',
    stage3: 'cactus with large white flowers, red-blue glowing pollen',
    stage4: 'red spiky dragon fruit forming with blue glow outline, red-blue particles',
    stage5: 'ripe red spiky dragon fruit with golden-red glow halo, floating blue light particles, golden star mark',
    product: 'red spiky dragon fruit, golden glow border, blue light particles, rounded rectangle blue-tinted backing'
  },
  { id: 54, name: '燕窝果', enName: 'Bird Nest Fruit',
    stage1: 'white glowing sprout with blue light from soil, bird nest-shaped first leaves',
    stage2: 'climbing cactus with white-luminous stems, blue-cyan glow aura',
    stage3: 'cactus with bird nest-shaped white flowers, blue glowing pollen',
    stage4: 'white spiky bird nest fruit forming with blue glow, nest-like pattern on fruit',
    stage5: 'ripe white spiky bird nest fruit with golden-blue glow halo, floating blue light particles, golden star mark',
    product: 'white spiky bird nest fruit, golden glow border, blue light particles, rounded rectangle blue-tinted backing'
  }
];

const superRareCrops_55_74 = [
  { id: 55, name: '天使果', enName: 'Angel Fruit',
    stage1: 'bright golden light orb emerging from soil, angelic white glow',
    stage2: 'ethereal plant with white feather-like leaves, golden luminescence',
    stage3: 'glowing white flower with angel wing-shaped petals, golden light column rising',
    stage4: 'white fruit with small angel wings forming, golden particles swirling',
    stage5: 'glowing white fruit with angel wings, radiant golden halo, floating golden sparkle particles, golden star mark',
    product: 'glowing white fruit with angel wings, radiant golden glow border, golden sparkle particles, rounded rectangle golden-tinted backing with dark pattern'
  },
  { id: 56, name: '精灵果', enName: 'Elf Fruit',
    stage1: 'green golden-glowing sprout with pointed elf-ear-shaped first leaves',
    stage2: 'slender plant with pointed glowing green leaves, golden luminescent veins',
    stage3: 'plant with bell-shaped green flowers, golden light particles dancing around',
    stage4: 'green fruit with pointed elf ear shapes forming, golden flowing light streaks',
    stage5: 'glowing green fruit with pointed elf ears, radiant golden halo, floating golden sparkle particles, golden star mark',
    product: 'glowing green fruit with pointed elf ears, golden glow border, golden sparkle particles, rounded rectangle golden-tinted backing with dark pattern'
  },
  { id: 57, name: '仙果', enName: 'Fairy Fruit',
    stage1: 'pink golden-glowing light orb emerging from soil, fairy dust particles',
    stage2: 'graceful plant with translucent pink leaves, golden luminescent aura',
    stage3: 'plant with pink lotus-like flowers, golden light column with pink sparkles',
    stage4: 'light pink fruit with fairy wing patterns forming, golden particle vortex',
    stage5: 'glowing light pink fairy fruit with halo ring, radiant golden halo, floating golden sparkle particles, golden star mark',
    product: 'glowing light pink fairy fruit with halo, golden glow border, golden sparkle particles, rounded rectangle golden-tinted backing with dark pattern'
  },
  { id: 58, name: '神果', enName: 'Divine Fruit',
    stage1: 'intense golden light beam emerging from soil, divine radiance',
    stage2: 'majestic plant with golden-veined leaves, brilliant golden luminescence',
    stage3: 'plant with golden lotus flowers, divine golden light column with sparkles',
    stage4: 'golden fruit with halo ring forming, intense golden particle storm',
    stage5: 'glowing golden divine fruit with radiant halo ring, brilliant golden glow halo, floating golden sparkle particles, golden star mark',
    product: 'glowing golden divine fruit with halo ring, brilliant golden glow border, golden sparkle particles, rounded rectangle golden-tinted backing with dark pattern'
  },
  { id: 59, name: '圣果', enName: 'Holy Fruit',
    stage1: 'pure white light orb with cross-shaped glow emerging from soil',
    stage2: 'plant with white luminous leaves, golden-white holy light aura',
    stage3: 'plant with white cross-shaped flowers, golden-white light column',
    stage4: 'white fruit with cross-shaped light emblem forming, golden particle cascade',
    stage5: 'glowing white holy fruit with cross-shaped light, radiant golden-white halo, floating golden sparkle particles, golden star mark',
    product: 'glowing white holy fruit with cross-shaped light, golden glow border, golden sparkle particles, rounded rectangle golden-tinted backing with dark pattern'
  },
  { id: 60, name: '龙果', enName: 'Dragon Fruit',
    stage1: 'red golden-glowing sprout with dragon scale-like first leaves',
    stage2: 'fierce-looking plant with scale-patterned red leaves, golden luminescence',
    stage3: 'plant with dragon scale flowers, golden light column with red flickers',
    stage4: 'red fruit with dragon scale pattern forming, golden particle whirlwind',
    stage5: 'glowing red dragon fruit with dragon scales, radiant golden halo, floating golden sparkle particles, golden star mark',
    product: 'glowing red fruit with dragon scales, golden glow border, golden sparkle particles, rounded rectangle golden-tinted backing with dark pattern'
  },
  { id: 61, name: '凤果', enName: 'Phoenix Fruit',
    stage1: 'orange golden-glowing sprout with phoenix feather-like first leaves',
    stage2: 'elegant plant with orange feather-like leaves, golden luminescent aura',
    stage3: 'plant with phoenix tail flowers, golden-orange light column with flame-like sparkles',
    stage4: 'orange fruit with phoenix tail feather patterns forming, golden particle vortex',
    stage5: 'glowing orange phoenix fruit with phoenix tail feathers, radiant golden halo, floating golden sparkle particles, golden star mark',
    product: 'glowing orange fruit with phoenix tail feathers, golden glow border, golden sparkle particles, rounded rectangle golden-tinted backing with dark pattern'
  },
  { id: 62, name: '麒麟果王', enName: 'Qilin King Fruit',
    stage1: 'yellow golden-glowing sprout with horn-shaped first leaves',
    stage2: 'majestic plant with golden-yellow leaves, brilliant golden luminescence',
    stage3: 'plant with qilin horn-shaped flowers, intense golden light column',
    stage4: 'yellow fruit with horn protrusions forming, golden particle maelstrom',
    stage5: 'glowing yellow qilin king fruit with horn, radiant golden halo, floating golden sparkle particles, golden star mark',
    product: 'glowing yellow fruit with horn, radiant golden glow border, golden sparkle particles, rounded rectangle golden-tinted backing with dark pattern'
  },
  { id: 63, name: '凤凰果', enName: 'Phoenix Flame Fruit',
    stage1: 'red-golden flame-like sprout emerging from soil with ember particles',
    stage2: 'fiery plant with flame-patterned red-gold leaves, intense golden luminescence',
    stage3: 'plant with phoenix flame flowers, golden-red light column with fire particles',
    stage4: 'red-golden fruit with flame patterns forming, golden fire particle storm',
    stage5: 'glowing red-golden phoenix fruit with flames, radiant golden halo, floating golden sparkle and ember particles, golden star mark',
    product: 'glowing red-golden fruit with flames, intense golden glow border, golden sparkle particles, rounded rectangle golden-tinted backing with dark pattern'
  },
  { id: 64, name: '炼狱果', enName: 'Purgatory Fruit',
    stage1: 'dark red glowing sprout with molten lava cracks in soil',
    stage2: 'ominous plant with dark red leaves, molten lava vein patterns, golden luminescence',
    stage3: 'plant with inferno flowers, dark red-golden light column with lava particles',
    stage4: 'dark red fruit with molten lava crack patterns forming, golden particle whirlwind',
    stage5: 'dark red blazing purgatory fruit with molten lava cracks, radiant golden halo, floating golden sparkle and ember particles, golden star mark',
    product: 'dark red blazing fruit with molten lava cracks, golden glow border, golden sparkle particles, rounded rectangle golden-tinted backing with dark pattern'
  },
  { id: 65, name: '地狱火果', enName: 'Hellfire Fruit',
    stage1: 'burning red sprout with flames emerging from cracked soil',
    stage2: 'infernal plant with burning red leaves, flame-like golden luminescence',
    stage3: 'plant with hellfire flowers, red-golden light column with roaring flame particles',
    stage4: 'burning red fruit with flame aura forming, golden fire particle vortex',
    stage5: 'burning red hellfire fruit with flames, radiant golden halo, floating golden sparkle and fire particles, golden star mark',
    product: 'burning red fruit with flames, intense golden glow border, golden sparkle particles, rounded rectangle golden-tinted backing with dark pattern'
  },
  { id: 66, name: '暗影果', enName: 'Shadow Fruit',
    stage1: 'deep purple glowing sprout with dark shadow aura emerging from soil',
    stage2: 'mysterious plant with deep purple leaves, dark shadowy golden luminescence',
    stage3: 'plant with shadow flowers, deep purple-golden light column with dark particles',
    stage4: 'deep purple fruit with dark aura forming, golden particle shadows swirling',
    stage5: 'deep purple glowing shadow fruit with dark aura, radiant golden halo, floating golden sparkle and shadow particles, golden star mark',
    product: 'deep purple glowing fruit with dark aura, golden glow border, golden sparkle particles, rounded rectangle golden-tinted backing with dark pattern'
  },
  { id: 67, name: '深渊果', enName: 'Abyss Fruit',
    stage1: 'deep black glowing sprout with swirling vortex pattern in soil',
    stage2: 'abyssal plant with deep black leaves, swirling golden-dark luminescence',
    stage3: 'plant with vortex flowers, black-golden light column with swirling particles',
    stage4: 'deep black fruit with swirling vortex forming, golden particle spiral',
    stage5: 'deep black glowing abyss fruit with swirling vortex, radiant golden halo, floating golden sparkle and vortex particles, golden star mark',
    product: 'deep black glowing fruit with swirling vortex, golden glow border, golden sparkle particles, rounded rectangle golden-tinted backing with dark pattern'
  },
  { id: 68, name: '混沌果', enName: 'Chaos Fruit',
    stage1: 'multicolored glowing sprout with chaotic spiral pattern emerging from soil',
    stage2: 'chaotic plant with multicolored spiral leaves, prismatic golden luminescence',
    stage3: 'plant with chaos spiral flowers, multicolored golden light column with spiral particles',
    stage4: 'colorful spiral fruit with chaos patterns forming, golden particle whirlwind',
    stage5: 'colorful spiral chaos fruit, radiant golden halo, floating golden sparkle and multicolored particles, golden star mark',
    product: 'colorful spiral chaos fruit, golden glow border, golden sparkle particles, rounded rectangle golden-tinted backing with dark pattern'
  },
  { id: 69, name: '虚空果', enName: 'Void Fruit',
    stage1: 'purple-black glowing sprout with hollow center light emerging from soil',
    stage2: 'void plant with purple-black translucent leaves, hollow golden luminescence',
    stage3: 'plant with void flowers featuring hollow centers, purple-black golden light column',
    stage4: 'purple-black fruit with hollow center forming, golden particle void vortex',
    stage5: 'purple-black glowing void fruit with hollow center, radiant golden halo, floating golden sparkle and void particles, golden star mark',
    product: 'purple-black glowing fruit with hollow center, golden glow border, golden sparkle particles, rounded rectangle golden-tinted backing with dark pattern'
  },
  { id: 70, name: '星陨果', enName: 'Meteorite Fruit',
    stage1: 'iron metallic glowing sprout with meteor trail light emerging from cratered soil',
    stage2: 'metallic plant with iron-colored crystalline leaves, golden luminescence',
    stage3: 'plant with meteor shower flowers, iron-golden light column with shooting star particles',
    stage4: 'meteorite-shaped fruit with iron texture forming, golden particle meteor shower',
    stage5: 'meteorite-shaped glowing fruit with iron metallic texture, radiant golden halo, floating golden sparkle and meteor particles, golden star mark',
    product: 'meteorite-shaped fruit with iron metallic texture, golden glow border, golden sparkle particles, rounded rectangle golden-tinted backing with dark pattern'
  },
  { id: 71, name: '星辉果', enName: 'Starlight Fruit',
    stage1: 'silver glowing sprout with twinkling star light emerging from soil',
    stage2: 'stellar plant with silver star-shaped leaves, twinkling golden luminescence',
    stage3: 'plant with starlight flowers, silver-golden light column with twinkling star particles',
    stage4: 'silver fruit with starlight pattern forming, golden star particle cascade',
    stage5: 'twinkling starlight silver fruit, radiant golden halo, floating golden sparkle and twinkling star particles, golden star mark',
    product: 'twinkling starlight silver fruit, golden glow border, golden sparkle particles, rounded rectangle golden-tinted backing with dark pattern'
  },
  { id: 72, name: '星河果', enName: 'Galaxy Fruit',
    stage1: 'blue glowing sprout with galaxy spiral light emerging from soil',
    stage2: 'cosmic plant with blue galaxy-patterned leaves, golden luminescence',
    stage3: 'plant with galaxy swirl flowers, blue-golden light column with star particles',
    stage4: 'blue fruit with galaxy spiral pattern forming, golden star particle vortex',
    stage5: 'blue fruit with galaxy pattern, radiant golden halo, floating golden sparkle and stellar particles, golden star mark',
    product: 'blue fruit with galaxy pattern, golden glow border, golden sparkle particles, rounded rectangle golden-tinted backing with dark pattern'
  },
  { id: 73, name: '星际果', enName: 'Interstellar Fruit',
    stage1: 'space blue glowing sprout with planet ring-like light emerging from soil',
    stage2: 'interstellar plant with space blue leaves featuring planet patterns, golden luminescence',
    stage3: 'plant with planet ring flowers, space blue-golden light column with orbital particles',
    stage4: 'space blue fruit with planet ring pattern forming, golden orbital particle dance',
    stage5: 'interstellar space blue fruit with planet pattern, radiant golden halo, floating golden sparkle and orbital particles, golden star mark',
    product: 'space blue fruit with planet pattern, golden glow border, golden sparkle particles, rounded rectangle golden-tinted backing with dark pattern'
  },
  { id: 74, name: '宇宙果', enName: 'Cosmos Fruit',
    stage1: 'deep purple cosmos sprout with galaxy cluster light emerging from soil',
    stage2: 'cosmic plant with deep purple nebula-patterned leaves, golden luminescence',
    stage3: 'plant with cosmos flowers featuring galaxy patterns, deep purple-golden light column',
    stage4: 'deep purple cosmos fruit with galaxy pattern forming, golden nebula particle swirl',
    stage5: 'deep purple cosmos fruit with galaxy pattern, radiant golden halo, floating golden sparkle and nebula particles, golden star mark',
    product: 'deep purple fruit with galaxy pattern, golden glow border, golden sparkle particles, rounded rectangle golden-tinted backing with dark pattern'
  }
];

const topCrops_75_84 = [
  { id: 75, name: '创世纪果', enName: 'Genesis Fruit',
    stage1: 'brilliant golden light orb with rainbow creation light emerging from soil, prismatic particles',
    stage2: 'divine plant with golden-rainbow veined leaves, holographic luminescence, rotating light ring forming',
    stage3: 'plant with creation flowers radiating rainbow light, rainbow light column with holographic sparkles, rotating energy ring',
    stage4: 'golden fruit with creation light patterns forming, rainbow gradient particle vortex, spinning light halo',
    stage5: 'golden glowing genesis fruit with creation light, rainbow gradient glow halo, rotating ring, holographic particles, golden star mark',
    product: 'golden glowing genesis fruit with creation light, rainbow gradient glow border, rotating ring, holographic shimmer particles, rounded rectangle golden patterned backing'
  },
  { id: 76, name: '初始果', enName: 'Primordial Fruit',
    stage1: 'pure white light orb with rainbow edge emerging from soil, raw energy particles',
    stage2: 'ethereal plant with pure white luminous leaves, rainbow-tinted aura, rotating light ring',
    stage3: 'plant with primordial flowers of pure light, white-rainbow energy column, spinning holographic ring',
    stage4: 'pure white fruit with raw energy aura forming, rainbow gradient particle cascade, rotating halo',
    stage5: 'pure white glowing primordial fruit with raw energy, rainbow gradient glow halo, rotating ring, holographic particles, golden star mark',
    product: 'pure white glowing primordial fruit with raw energy, rainbow gradient glow border, rotating ring, holographic shimmer particles, rounded rectangle golden patterned backing'
  },
  { id: 77, name: '起源果', enName: 'Origin Fruit',
    stage1: 'blue-white glowing sprout with rainbow creation energy emerging from soil',
    stage2: 'majestic plant with blue-white luminous leaves, rainbow-tinted glow, rotating light ring',
    stage3: 'plant with origin flowers of blue-white light, blue-white-rainbow energy column, spinning holographic ring',
    stage4: 'blue-white fruit with creation power aura forming, rainbow particle vortex, rotating halo',
    stage5: 'blue-white glowing origin fruit with creation power, rainbow gradient glow halo, rotating ring, holographic particles, golden star mark',
    product: 'blue-white glowing origin fruit with creation power, rainbow gradient glow border, rotating ring, holographic shimmer particles, rounded rectangle golden patterned backing'
  },
  { id: 78, name: '太初果', enName: 'Taiji Fruit',
    stage1: 'black-white yin-yang glowing orb emerging from soil, rainbow prismatic edge light',
    stage2: 'balanced plant with black-white dual-tone leaves, rainbow luminescence, rotating yin-yang ring',
    stage3: 'plant with yin-yang flowers, black-white-rainbow energy column, spinning holographic ring',
    stage4: 'fruit with glowing yin-yang taiji symbol forming, rainbow gradient particle spiral, rotating halo',
    stage5: 'fruit with glowing yin-yang taiji symbol, rainbow gradient glow halo, rotating ring, holographic particles, golden star mark',
    product: 'fruit with glowing yin-yang taiji symbol, rainbow gradient glow border, rotating ring, holographic shimmer particles, rounded rectangle golden patterned backing'
  },
  { id: 79, name: '元始果', enName: 'Primordial Rune Fruit',
    stage1: 'golden glowing sprout with ancient rune patterns emerging from soil, rainbow light',
    stage2: 'ancient-looking plant with rune-inscribed golden leaves, rainbow-tinted luminescence, rotating light ring',
    stage3: 'plant with primordial rune flowers, golden-rainbow energy column with rune particles, spinning holographic ring',
    stage4: 'golden fruit with primordial runes forming, rainbow gradient particle storm, rotating halo',
    stage5: 'golden glowing fruit with primordial runes, rainbow gradient glow halo, rotating ring, holographic particles, golden star mark',
    product: 'golden glowing fruit with primordial runes, rainbow gradient glow border, rotating ring, holographic shimmer particles, rounded rectangle golden patterned backing'
  },
  { id: 80, name: '永恒果', enName: 'Eternal Fruit',
    stage1: 'silver glowing sprout with infinity loop light emerging from soil, rainbow edge',
    stage2: 'timeless plant with silver infinity-patterned leaves, rainbow luminescence, rotating infinity ring',
    stage3: 'plant with eternity flowers, silver-rainbow energy column with infinity particles, spinning holographic ring',
    stage4: 'silver fruit with infinity loop rings forming, rainbow gradient particle infinity spiral, rotating halo',
    stage5: 'silver fruit surrounded by infinity loop rings, rainbow gradient glow halo, rotating ring, holographic particles, golden star mark',
    product: 'silver fruit with infinity loop rings, rainbow gradient glow border, rotating ring, holographic shimmer particles, rounded rectangle golden patterned backing'
  },
  { id: 81, name: '终焉果', enName: 'Apocalypse Fruit',
    stage1: 'dark and light contrasting sprout with rainbow judgment light emerging from soil',
    stage2: 'apocalyptic plant with contrasting dark-light leaves, rainbow-luminous aura, rotating light ring',
    stage3: 'plant with judgment flowers of dual light-dark, dark-light-rainbow energy column, spinning holographic ring',
    stage4: 'apocalyptic judgment-style fruit forming, rainbow gradient particle storm, rotating halo',
    stage5: 'apocalyptic judgment-style glowing fruit with dark and light contrast, rainbow gradient glow halo, rotating ring, holographic particles, golden star mark',
    product: 'apocalyptic judgment-style fruit with dark and light contrast, rainbow gradient glow border, rotating ring, holographic shimmer particles, rounded rectangle golden patterned backing'
  },
  { id: 82, name: '毁灭果', enName: 'Destruction Fruit',
    stage1: 'black core sprout with red flame cracks and rainbow edge emerging from scorched soil',
    stage2: 'destructive plant with black leaves and red flame veins, rainbow-tinted luminescence, rotating ring',
    stage3: 'plant with destruction flowers of black flame, black-red-rainbow energy column, spinning holographic ring',
    stage4: 'black core fruit with flame cracks forming, rainbow gradient particle firestorm, rotating halo',
    stage5: 'black core fruit with flame cracks, rainbow gradient glow halo, rotating ring, holographic particles, golden star mark',
    product: 'black core fruit with red flame cracks, rainbow gradient glow border, rotating ring, holographic shimmer particles, rounded rectangle golden patterned backing'
  },
  { id: 83, name: '重生果', enName: 'Rebirth Fruit',
    stage1: 'phoenix fire glowing sprout with rainbow rebirth light emerging from ashes in soil',
    stage2: 'phoenix-inspired plant with fire-colored leaves, rainbow luminescence, rotating phoenix ring',
    stage3: 'plant with phoenix rebirth flowers, phoenix fire-rainbow energy column, spinning holographic ring',
    stage4: 'phoenix rebirth-style fruit forming, rainbow gradient particle phoenix wings, rotating halo',
    stage5: 'phoenix rebirth-style glowing fruit, rainbow gradient glow halo, rotating ring, holographic particles, golden star mark',
    product: 'phoenix rebirth-style glowing fruit, rainbow gradient glow border, rotating ring, holographic shimmer particles, rounded rectangle golden patterned backing'
  },
  { id: 84, name: '永恒圣果', enName: 'Eternal Holy Fruit',
    stage1: 'divine light orb with six small wing-like lights and rainbow aura emerging from soil',
    stage2: 'ultimate divine plant with six luminous wing-leaves, rainbow-tinged golden luminescence, rotating rings',
    stage3: 'plant with six-wing divine flowers, divine light-rainbow energy column, spinning holographic rings',
    stage4: 'ultimate divine fruit with six angel wings forming, rainbow gradient particle divine storm, rotating halos',
    stage5: 'ultimate divine glowing fruit with six angel wings, rainbow gradient glow halo, rotating rings, holographic particles, golden star mark',
    product: 'ultimate divine glowing fruit with six angel wings, rainbow gradient glow border, rotating rings, holographic shimmer particles, rounded rectangle golden patterned backing'
  }
];

const allEffectCrops = [
  ...rareCrops_35_44,
  ...rarePlusCrops_45_54,
  ...superRareCrops_55_74,
  ...topCrops_75_84
];

function getAllEffectTasks() {
  const tasks = [];

  allEffectCrops.forEach(crop => {
    for (let stage = 1; stage <= 5; stage++) {
      const stageKey = `stage${stage}`;
      tasks.push({
        type: 'growth_stage',
        id: crop.id,
        stage: stage,
        filename: `${crop.id}_stage_${stage}.jpg`,
        outputDir: 'crops/stages',
        data: {
          ...crop,
          stageVisual: crop[stageKey],
          stageNum: stage,
          quality: getQualityLabel(crop.id),
          effects: getEffectPreset(crop.id)
        }
      });
    }

    tasks.push({
      type: 'product_icon',
      id: crop.id,
      stage: null,
      filename: `crop_${crop.id}.jpg`,
      outputDir: 'icons/crops',
      data: {
        ...crop,
        productVisual: crop.product,
        quality: getQualityLabel(crop.id),
        effects: getEffectPreset(crop.id)
      }
    });
  });

  return tasks;
}

module.exports = {
  EFFECT_PRESETS,
  getEffectPreset,
  getQualityLabel,
  rareCrops_35_44,
  rarePlusCrops_45_54,
  superRareCrops_55_74,
  topCrops_75_84,
  allEffectCrops,
  getAllEffectTasks
};