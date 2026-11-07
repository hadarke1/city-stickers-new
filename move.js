
// --- Matter.js Setup ---
const {
    Engine,
    Runner,
    Bodies,
    Body,
    Composite,
    Constraint,
    Events,
    Query
} = Matter;

const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');
const page = document.getElementById('page');
const content = document.getElementById('content');
const filterBar = document.getElementById('filter-bar');
const organizeButton = document.getElementById('organizeButton');

const engine = Engine.create();
const world = engine.world;

// --- Floating Physics Settings ---
engine.gravity.scale = 0;   // No gravity: stickers hover wherever they are left
const frictionAir = 0.04;   // Low air resistance, so a released sticker glides to a stop
const restitution = 0.4;    // Soft bounce when stickers bump into each other
const FLOAT_FORCE = 0.000015; // How strongly each sticker sways around its spot
const SPIN_FORCE = 0.00000002; // How strongly it turns back and forth
const TILT_FORCE = 0.0002;  // How strongly tilting a phone nudges the stickers

let isGridMode = false; // Flag to track grid mode, initially false (chaos mode)
let activeCategory = 'all';

// Sticker positions are page coordinates: x from the left of the page, y from its top.
// The canvas lives inside the page and is two screens tall, so the browser scrolls it
// together with the text. It only hops to a new spot when the view nears its edge.
let pageWidth = 0;
let pageHeight = 0;
let canvasWidth = 0;
let canvasHeight = 0;
let canvasTop = 0;
let walls = [];
let stickerSide = 0; // Every sticker covers the area of a square with this side
let labelOpacity = 0; // Grid labels fade in while the stickers travel
let gridAnimationId = null;

let bodies = []; // Array to hold Matter.js bodies for your images

// --- Image Assets ---
const images = [
    'png/1.png', 'png/2.png', 'png/3.png', 'png/4.png', 'png/44.png', 'png/55.png',
    'png/afa.png', 'png/g.png', 'png/h.png',
    'png/Layer 1.png', 'png/Layer 2.png', 'png/Layer 3.png', 'png/Layer 4.png', 'png/Layer 5.png',
    'png/Layer 6.png', 'png/Layer 7.png', 'png/Layer 9.png', 'png/Layer 10.png',
    'png/Layer 11.png', 'png/Layer 12.png', 'png/Layer 13.png', 'png/Layer 14.png', 'png/Layer 15.png',
    'png/Layer 16.png', 'png/Layer 17.png', 'png/usm.png', 'png/veld.png',
    'png/u1.png', 'png/u2.png', 'png/u3.png', 'png/u4.png', 'png/u5.png', 'png/u7.png', 'png/u8.png', 'png/u9.png',
    'png/i1.png', 'png/i2.png', 'png/i4.png', 'png/i5.png', 'png/i6.png', 'png/y1.png',
    'png/y2.png', 'png/y3.png', 'png/y4.png', 'png/y6.png', 'png/y5.png', 'png/y7.png', 'png/y8.png', 'png/j.png', 'png/h1.png', 'png/h2.png',
    'png/h3.png', 'png/h4.png', 'png/h5.png', 'png/h6.png', 'png/h7.png', 'png/h8.png', 'png/Layer 18.png', 'png/Layer 19.png',
    'png/Layer 20.png', 'png/Layer 21.png', 'png/Layer 22.png', 'png/Layer 23.png', 'png/Layer 24.png', 'png/Layer 25.png',
    'png/q1.png', 'png/q2.png', 'png/q3.png', 'png/q4.png', 'png/q5.png', 'png/q6.png', 'png/q7.png', 'png/q8.png', 'png/q9.png', 'png/q10.png', 'png/q11.png', 'png/q12.png',
    'png/q13.png', 'png/q14.png', 'png/q15.png', 'png/q16.png', 'png/q17.png', 'png/q18.png', 'png/q19.png', 'png/q20.png', 'png/q21.png', 'png/q22.png', 'png/q23.png', 'png/q24.png', 'png/q25.png', 'png/q26.png',
    'png/q27.png', 'png/q28.png', 'png/q29.png', 'png/q30.png', 'png/q31.png', 'png/q32.png'
];
const loadedImages = []; // Stores loaded Image objects

const imageCategories = {
    'png/1.png': 'advertising', 'png/2.png': 'sports/city pride', 'png/3.png': 'sports/city pride', 'png/4.png': 'personal/artistic', 'png/44.png': 'personal/artistic', 'png/55.png': 'personal/artistic', 'png/afa.png': 'political', 'png/g.png': 'advertising', 'png/h.png': 'personal/artistic',
    'png/h1.png': 'personal/artistic', 'png/h2.png': 'advertising', 'png/h3.png': 'political', 'png/h4.png': 'political', 'png/h5.png': 'advertising', 'png/h6.png': 'political', 'png/h7.png': 'sports/city pride', 'png/h8.png': 'political', 'png/hsdf.png': 'political',
    'png/i1.png': 'personal/artistic', 'png/i2.png': 'nett hier!', 'png/i4.png': 'advertising', 'png/i5.png': 'nett hier!', 'png/i6.png': 'nett hier!',
    'png/j.png': 'sports/city pride', 'png/Layer 1.png': 'political', 'png/Layer 2.png': 'personal/artistic', 'png/Layer 3.png': 'advertising', 'png/Layer 4.png': 'personal/artistic', 'png/Layer 5.png': 'personal/artistic', 'png/Layer 6.png': 'advertising', 'png/Layer 7.png': 'personal/artistic', 'png/Layer 9.png': 'personal/artistic', 'png/Layer 10.png': 'advertising', 'png/Layer 11.png': 'personal/artistic', 'png/Layer 12.png': 'personal/artistic', 'png/Layer 13.png': 'personal/artistic', 'png/Layer 14.png': 'advertising', 'png/Layer 15.png': 'advertising', 'png/Layer 16.png': 'personal/artistic', 'png/Layer 17.png': 'personal/artistic',
    'png/u1.png': 'political', 'png/u2.png': 'sports/city pride', 'png/u3.png': 'sports/city pride', 'png/u4.png': 'advertising', 'png/u5.png': 'sports/city pride', 'png/u7.png': 'advertising', 'png/u9.png': 'advertising', 'png/u8.png': 'personal/artistic', 'png/usm.png': 'sports/city pride', 'png/veld.png': 'personal/artistic',
    'png/y1.png': 'nett hier!', 'png/y2.png': 'advertising', 'png/y3.png': 'nett hier!', 'png/y4.png': 'advertising', 'png/y5.png': 'sports/city pride', 'png/y6.png': 'advertising', 'png/y7.png': 'advertising', 'png/y8.png': 'personal/artistic',
    'png/Layer 18.png': 'political', 'png/Layer 19.png': 'political', 'png/Layer 20.png': 'political', 'png/Layer 21.png': 'advertising', 'png/Layer 22.png': 'sports/city pride', 'png/Layer 23.png': 'political', 'png/Layer 24.png': 'personal/artistic', 'png/Layer 25.png': 'advertising',
    'png/q1.png': 'personal/artistic', 'png/q2.png': 'political', 'png/q3.png': 'advertising', 'png/q4.png': 'personal/artistic', 'png/q5.png': 'personal/artistic', 'png/q6.png': 'personal/artistic', 'png/q7.png': 'sports/city pride', 'png/q8.png': 'political', 'png/q9.png': 'personal/artistic', 'png/q10.png': 'political', 'png/q11.png': 'sports/city pride', 'png/q12.png': 'personal/artistic',
    'png/q13.png': 'sports/city pride', 'png/q14.png': 'personal/artistic', 'png/q15.png': 'advertising', 'png/q16.png': 'sports/city pride', 'png/q17.png': 'personal/artistic', 'png/q18.png': 'sports/city pride', 'png/q19.png': 'political', 'png/q20.png': 'sports/city pride', 'png/q21.png': 'political', 'png/q22.png': 'political', 'png/q23.png': 'political', 'png/q24.png': 'sports/city pride', 'png/q25.png': 'sports/city pride', 'png/q26.png': 'sports/city pride',
    'png/q27.png': 'personal/artistic', 'png/q28.png': 'personal/artistic', 'png/q29.png': 'personal/artistic', 'png/q30.png': 'sports/city pride', 'png/q31.png': 'personal/artistic', 'png/q32.png': 'personal/artistic',
};

// Define your imageTextData array with number, description, translation and location
// MAKE SURE THE ORDER OF THESE TEXTS MATCHES THE ORDER OF YOUR 'images' ARRAY
const imageTextData = [
    { number: "01", description: "a black heart advertising raulstefan tattooer.", translation: "n/a.", location: "49°5958.8N 8°1625.0E" },
    { number: "02", description: "two covered faces of ultras mainz fans/hooligans.", translation: "n/a.", location: "49°98872.7N 8°22458.2E" },
    { number: "03", description: "a simple red, white and black sticker: LVNG MNZ.", translation: "Loving Mainz.", location: "49°5922.1N 8°1331.2E" },
    { number: "04", description: "a yellow sticker stating: DU BIST SO SCHON SELBST & STANDIG!", translation: "YOU ARE SO BEAUTIFUL YOURSELF & ALWAYS!", location: "49°59'51.5N 8°16'46.9E" },
    { number: "05", description: "the letters WZ in light blue color.", translation: "n/a.", location: "49°99743.6N, 8°27827.2E" },
    { number: "06", description: "A name written in a street style - PANIK.", translation: "n/a.", location: "49°5950.6N 8°1641.7E" },
    { number: "07", description: "A sticker stating “dorf antifa DRF AFA schwaim foer kreis.”", translation: "n/a.", location: "49°5922.7N 8°1333.7E" },
    { number: "08", description: "A green leaf with peaceful face, advertising old but golds tattoo shop.", translation: "n/a", location: "50°0013.7N 8°1610.7E" },
    { number: "09", description: "A cartoon dog gnawing on its own leg.", translation: "n/a.", location: "49°5942.0N 8°1331.5E" },
    { number: "10", description: "“VIVE LE SERVICE PUBLIC quand tout sera prive, on sera prive de tout”", translation: "“LONG LIVE PUBLIC SERVICE when everything is private, we will be deprived of everything”", location: "49°5954.2N 8°1641.5E" },
    { number: "11", description: "a black circular sticker: “SPJAM.”", translation: "n/a.", location: "49°5950.9N 8°1646.3E" },
    { number: "12", description: "a black and white sticker advertising the KD student council.", translation: "“student council.”", location: "49°5947.3N 8°1644.4E" },
    { number: "13", description: "a square, red sticker featuring a frog smoking a cigarette.", translation: "n/a.", location: "49°5950.9N 8°1646.3E" },
    { number: "14", description: "an artistic piece in black and yellow.", translation: "n/a.", location: "49°5950.9N 8°1646.3E" },
    { number: "15", description: "Final artistic piece in the collection.", translation: "", location: "" },
    { number: "16", description: "two anthropomorphic bunnies, one red and one blue, engaged in an intimate pose.", translation: "n/a", location: "49°99683.5N 8°27919.6E" },
    { number: "17", description: "a purple sticker stating: “very happy 2024. fontspectrum.com.”", translation: "n/a", location: "49°5950.9N 8°1646.3E" },
    { number: "18", description: "a square sticker in shades of pink and purple, advertising the UN/SEEN symposium.", translation: "n/a.", location: "49°5947.3N 8°1644.4E" },
    { number: "19", description: "a drawing of a creature peeking out of a trash can.", translation: "n/a.", location: "49°5950.9N 8°1646.3E" },
    { number: "20", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "21", description: "4 girls in matching outfits, “the space girls the lunar edition mission completed.”", translation: "n/a", location: "49°5950.9N 8°1646.3E" },
    { number: "22", description: "a grey circular sticker advertising the 2023 KD werkschau.", translation: "“workshow, 14-15 july 23, HS mainz, @hsm.kd.werkschau 14:00 - 20:00.”", location: "49°5947.3N 8°1644.4E" },
    { number: "23", description: "an eye.", translation: "n/a.", location: "49°5947.3N 8°1644.4E" },
    { number: "24", description: "a red sticker stating: “WER WARST DU, WENN DU DIE WAHL HATTEST?”", translation: "“WHO WERE YOU IF YOU HAD THE CHOICE?”", location: "49°5950.9N 8°1646.3E" },
    { number: "26", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "27", description: "“mainz 05 - fans gegen rechts!”", translation: "“Mainz 05 - fans against the right!”", location: "49°5906.1N 8°1333.7E" },
    { number: "28", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "29", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "30", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "31", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "32", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "33", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "34", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "35", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "36", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "37", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "38", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "39", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "40", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "41", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "42", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "43", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "44", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "45", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "46", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "47", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "48", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "49", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "50", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "51", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "52", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "53", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "54", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "55", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "56", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "57", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "58", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "59", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "60", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "61", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "62", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "63", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "64", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "65", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "66", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "67", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "68", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "69", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "70", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "71", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "72", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "73", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "74", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "75", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "76", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "77", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "78", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "79", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "80", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "81", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "82", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "83", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "84", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "85", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "86", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "87", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "88", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "89", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "90", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "91", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "92", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "93", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "94", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "95", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "96", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "97", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
    { number: "98", description: "a black and white drawing of a girl.", translation: "n/a.", location: "" },
];

// --- Utility Functions ---
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function wrapText(context, text, maxWidth) {
    const words = text.split(' ');
    let line = '';
    let lines = [];

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            lines.push(line.trim()); // Trim to remove trailing space
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line.trim()); // Add the last line, trimmed

    return lines;
}

// Writes one sticker's information as: >description. >translation - text. >location.
function endSentence(text) {
    return /[.!?]”?$/.test(text) ? text : `${text}.`;
}

function formatStickerInfo(info) {
    if (!info.translation && !info.location && info.description === 'No description') return info.description;
    return [
        `>${endSentence(info.description)}`,
        `>translation - ${endSentence(info.translation || 'n/a')}`,
        `>${endSentence(info.location || 'location - n/a')}`
    ].join(' ');
}

function getPageWidth() {
    return document.documentElement.clientWidth; // Excludes the scrollbar, unlike window.innerWidth
}

// The floating stickers' size: full size on desktop, shrinking with the screen
function getStickerSide(width) {
    return clamp(127 * width / 1100, 70, 127);
}

// Same area for every sticker, whatever its shape, so none looks heavier than the others
function fitToArea(aspectRatio, side) {
    return { width: side * Math.sqrt(aspectRatio), height: side / Math.sqrt(aspectRatio) };
}

function visibleBodies() {
    return bodies.filter(body => !body.renderImg.hidden);
}

// Matter.js overwrites a body's saved mass if it is made static twice, which breaks the
// physics (NaN positions) once it is released. This only ever changes it when needed.
function setFrozen(body, frozen) {
    if (body.isStatic !== frozen) Body.setStatic(body, frozen);
}

// --- Canvas Size ---
function resizeCanvas() {
    const width = getPageWidth();
    const height = window.innerHeight * 2;

    // Phones resize when the address bar slides away: no need to rebuild the canvas for that
    if (width === canvasWidth && height <= canvasHeight) return;

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2); // Sharper adds cost, not visible detail
    canvasWidth = width;
    canvasHeight = height;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
}

// Moves the canvas only when the view gets close to its edge, centered on the view
function updateCanvasPosition(scrollY, screenHeight) {
    const spare = canvasHeight - screenHeight;
    const lowest = Math.max(pageHeight - canvasHeight, 0);
    const nearTop = scrollY < canvasTop + spare / 4 && canvasTop > 0;
    const nearBottom = scrollY + screenHeight > canvasTop + canvasHeight - spare / 4 && canvasTop < lowest;

    if (nearTop || nearBottom || canvasTop > lowest) {
        canvasTop = Math.round(clamp(scrollY - spare / 2, 0, lowest));
        canvas.style.transform = `translateY(${canvasTop}px)`;
    }
}

// --- Page Height ---
// Chaos mode: exactly as tall as the text, since the stickers float on top of it
function getChaosPageHeight() {
    return Math.ceil(content.offsetHeight);
}

function setPageHeight(height) {
    pageHeight = height;
    page.style.height = `${height}px`;

    Composite.remove(world, walls);
    const thickness = 200; // Thick walls so fast-dragged stickers can't pass through them
    walls = [
        Bodies.rectangle(pageWidth / 2, height + thickness / 2, pageWidth + thickness * 2, thickness, { isStatic: true, label: 'ground' }),
        Bodies.rectangle(-thickness / 2, height / 2, thickness, height + thickness * 2, { isStatic: true, label: 'leftWall' }),
        Bodies.rectangle(pageWidth + thickness / 2, height / 2, thickness, height + thickness * 2, { isStatic: true, label: 'rightWall' }),
        Bodies.rectangle(pageWidth / 2, -thickness / 2, pageWidth + thickness * 2, thickness, { isStatic: true, label: 'ceiling' })
    ];
    Composite.add(world, walls);

    // With no gravity, nothing else would bring back a sticker left outside a shorter page
    if (!isGridMode) {
        bodies.forEach(body => {
            const { width, height } = body.renderImg;
            Body.setPosition(body, {
                x: clamp(body.position.x, width / 2, Math.max(pageWidth - width / 2, width / 2)),
                y: clamp(body.position.y, height / 2, Math.max(pageHeight - height / 2, height / 2))
            });
        });
    }
}

// --- Main Setup Function ---
function setup() {
    pageWidth = getPageWidth();
    stickerSide = getStickerSide(pageWidth);
    resizeCanvas();

    loadedImages.forEach((img, i) => {
        const { width, height } = fitToArea(img.naturalWidth / img.naturalHeight, stickerSide);

        const src = images[i];
        const category = imageCategories[src] || 'uncategorized';
        const textObjectForImage = imageTextData[i] || { number: '?', description: 'No description' };

        const body = Bodies.rectangle(0, 0, width, height, {
            label: `img${i}`,
            restitution: restitution,
            frictionAir: frictionAir
        });

        // Every sticker sways at its own pace, so they never move in step
        body.float = {
            phaseX: Math.random() * Math.PI * 2,
            phaseY: Math.random() * Math.PI * 2,
            phaseSpin: Math.random() * Math.PI * 2,
            speedX: 0.0004 + Math.random() * 0.0004,
            speedY: 0.0004 + Math.random() * 0.0004,
            speedSpin: 0.0002 + Math.random() * 0.0003
        };

        body.renderImg = {
            img,
            width,
            height,
            drawWidth: width,
            drawHeight: height,
            category,
            number: textObjectForImage.number,
            description: formatStickerInfo(textObjectForImage)
        };

        bodies.push(body);
    });

    Composite.add(world, bodies); // Add all created bodies to the physics world
    setPageHeight(getChaosPageHeight());
    scatterBodies();
}

// Spreads the stickers evenly over the page, so they cover the text from top to bottom
function scatterBodies() {
    const cols = Math.max(Math.round(Math.sqrt(bodies.length * pageWidth / pageHeight)), 1);
    const rows = Math.ceil(bodies.length / cols);
    const cellWidth = pageWidth / cols;
    const cellHeight = pageHeight / rows;

    const cells = bodies.map((body, i) => i);
    for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    bodies.forEach((body, i) => {
        const { width, height } = body.renderImg;
        const col = cells[i] % cols;
        const row = Math.floor(cells[i] / cols);
        const x = (col + 0.2 + Math.random() * 0.6) * cellWidth;
        const y = (row + 0.2 + Math.random() * 0.6) * cellHeight;
        Body.setPosition(body, {
            x: clamp(x, width / 2, Math.max(pageWidth - width / 2, width / 2)),
            y: clamp(y, height / 2, Math.max(pageHeight - height / 2, height / 2))
        });
        Body.setVelocity(body, { x: 0, y: 0 });
    });
}

// --- Floating ---
function applyFloating() {
    const time = engine.timing.timestamp;
    bodies.forEach(body => {
        if (body.isStatic || (dragConstraint && dragConstraint.bodyB === body)) return;
        const float = body.float;
        Body.applyForce(body, body.position, {
            x: body.mass * (FLOAT_FORCE * Math.sin(time * float.speedX + float.phaseX) + TILT_FORCE * tilt.x),
            y: body.mass * (FLOAT_FORCE * Math.sin(time * float.speedY + float.phaseY) + TILT_FORCE * tilt.y)
        });
        body.torque += body.inertia * SPIN_FORCE * Math.sin(time * float.speedSpin + float.phaseSpin);
    });
}

// --- Window Resize ---
function handleResize() {
    resizeCanvas();

    // Phones fire resize when the address bar slides away: only the width changes the layout
    const newWidth = getPageWidth();
    if (newWidth === pageWidth) return;

    const widthRatio = newWidth / pageWidth;
    const heightBefore = pageHeight;
    const newSide = getStickerSide(newWidth);
    const scaleRatio = newSide / stickerSide;

    pageWidth = newWidth;
    stickerSide = newSide;

    bodies.forEach(body => {
        const size = body.renderImg;
        const wasFrozen = body.isStatic;
        setFrozen(body, false);
        Body.scale(body, scaleRatio, scaleRatio);
        setFrozen(body, wasFrozen);
        size.width *= scaleRatio;
        size.height *= scaleRatio;
        size.drawWidth = size.width;
        size.drawHeight = size.height;
        Body.setPosition(body, { x: body.position.x * widthRatio, y: body.position.y });
    });

    if (isGridMode) {
        placeOnGrid(calculateGridPositions());
    } else {
        // Move the stickers first, so they stay spread out once the page has its new height
        const newHeight = getChaosPageHeight();
        const heightRatio = newHeight / heightBefore;
        bodies.forEach(body => {
            Body.setPosition(body, { x: body.position.x, y: body.position.y * heightRatio });
        });
        setPageHeight(newHeight);
    }
}

// --- Image Preloading ---
function preloadImages(callback) {
    let loadedCount = 0;
    images.forEach((src, i) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            loadedImages[i] = img;
            // Decoding now keeps a sticker from stalling the page the first time it scrolls into view
            img.decode().catch(() => {}).finally(() => {
                loadedCount++;
                if (loadedCount === images.length) callback();
            });
        };
        img.onerror = () => {
            console.error(`Failed to load image: ${src}`);
            loadedCount++;
            if (loadedCount === images.length) callback(); // Still call callback even if an image fails
        };
    });
}

// --- Main Render Loop ---
function render() {
    const pixelRatio = canvas.width / canvasWidth;

    updateCanvasPosition(window.scrollY, window.innerHeight);

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, -canvasTop * pixelRatio);
    ctx.clearRect(0, canvasTop, canvasWidth, canvasHeight); // Clear the part of the page the canvas covers

    const dragged = dragConstraint ? dragConstraint.bodyB : null;

    for (let i = 0; i < bodies.length; i++) {
        const body = bodies[i];
        const size = body.renderImg; // Contains the image, sizes, category, number, description

        if (size.hidden || body === dragged) continue;

        const margin = Math.max(size.drawWidth, size.drawHeight);
        const labelHeight = isGridMode ? (size.grid ? size.grid.belowHeight : 0) + 80 : 0;
        const onCanvas = body.position.y + margin + labelHeight > canvasTop
            && body.position.y - margin - labelHeight < canvasTop + canvasHeight;
        if (!onCanvas) continue;

        drawSticker(body);

        // Render text only in grid mode
        if (isGridMode && size.grid) {
            drawGridLabel(body);
        }
    }

    // The sticker being dragged is drawn last, so it stays on top
    if (dragged) drawSticker(dragged);

    requestAnimationFrame(render); // Loop the render function
}

function drawSticker(body, target = ctx) {
    const size = body.renderImg;
    target.save();
    target.translate(body.position.x, body.position.y);
    target.rotate(body.angle);
    target.drawImage(size.img, -size.drawWidth / 2, -size.drawHeight / 2, size.drawWidth, size.drawHeight);
    target.restore();
}

function drawGridLabel(body) {
    const size = body.renderImg;
    const grid = size.grid;
    const left = body.position.x - grid.cellWidth / 2;
    const top = body.position.y - size.drawHeight / 2;
    const bottom = body.position.y + size.drawHeight / 2;

    ctx.save();
    ctx.globalAlpha = labelOpacity;
    ctx.fillStyle = 'black';

    // --- Draw the Number (centered on top) ---
    ctx.textAlign = 'center';
    ctx.font = `bold ${grid.numberSize}px test`;
    ctx.fillText(size.number, body.position.x, top - grid.labelGap);

    // --- Draw the Description (below) ---
    ctx.textAlign = 'left';
    ctx.font = `${grid.textSize}px kb`;
    grid.lines.forEach((line, j) => {
        ctx.fillText(line, left, bottom + grid.labelGap + grid.lineHeight * (j + 0.75));
    });

    ctx.restore();
}

// --- Dragging Stickers ---
// Mouse: grab straight away. Touch: press and hold, so a normal swipe keeps scrolling the page.
const HOLD_TO_GRAB = 70; // Milliseconds
const MOVE_TOLERANCE = 10; // Pixels the finger may wander during the hold
const MAX_DRAG_SPEED = 25; // Keeps a fast drag from building up a huge throw
const MAX_THROW_SPEED = 10; // Speed a sticker keeps when it is let go, then it glides to a stop

const pointer = { id: null, x: 0, y: 0, startX: 0, startY: 0 };
let dragConstraint = null;
let holdTimer = null;

function pointerOnPage() {
    return { x: pointer.x, y: pointer.y + window.scrollY };
}

function bodyAtPointer() {
    const candidates = visibleBodies().filter(body => !body.isStatic);
    const hits = Query.point(candidates, pointerOnPage());
    return hits[hits.length - 1] || null; // The last one is drawn on top
}

function startDrag(body) {
    const position = pointerOnPage();
    dragConstraint = Constraint.create({
        pointA: position,
        bodyB: body,
        pointB: { x: position.x - body.position.x, y: position.y - body.position.y },
        length: 0.01,
        stiffness: 0.2,
        damping: 0.1,
        angularStiffness: 1
    });
    Composite.add(world, dragConstraint);
    document.documentElement.style.cursor = 'grabbing';

    // Keeps the drag going when the pointer leaves the window, so its release is never missed
    try {
        document.documentElement.setPointerCapture(pointer.id);
    } catch (error) {
        // Nothing to do: the pointer is already gone, and the next press starts clean
    }
}

function limitSpeed(body, maxSpeed) {
    const speed = Math.hypot(body.velocity.x, body.velocity.y);
    if (speed > maxSpeed) {
        Body.setVelocity(body, {
            x: body.velocity.x * maxSpeed / speed,
            y: body.velocity.y * maxSpeed / speed
        });
    }
}

function endDrag() {
    clearTimeout(holdTimer);
    holdTimer = null;
    pointer.id = null;
    if (dragConstraint) {
        limitSpeed(dragConstraint.bodyB, MAX_THROW_SPEED);
        Composite.remove(world, dragConstraint);
        dragConstraint = null;
    }
    document.documentElement.style.cursor = '';
    document.documentElement.classList.remove('is-grabbing');
}

// The controls stay clickable, even with a sticker floating behind them
function isOverControls(event) {
    return event.target instanceof Element && event.target.closest('button, #filter-bar, #gyro-info');
}

// The canvas lets the pointer through to the text, so dragging listens on the whole window.
// A press only becomes a drag when it lands on a sticker.
function setupDragging() {
    window.addEventListener('pointerdown', event => {
        // A second finger shouldn't disturb a drag in progress
        if (pointer.id !== null && event.pointerType !== 'mouse' && event.pointerId !== pointer.id) return;

        // A release can go missing (menus, switching windows). A new press always starts clean.
        endDrag();

        // Only the main button drags. On a Mac, control-click opens the menu like a right-click.
        if (event.button !== 0 || event.ctrlKey || isOverControls(event)) return;

        pointer.x = pointer.startX = event.clientX;
        pointer.y = pointer.startY = event.clientY;

        const body = bodyAtPointer();
        if (!body) return;

        pointer.id = event.pointerId;
        document.documentElement.classList.add('is-grabbing'); // No text selection under a sticker

        if (event.pointerType === 'mouse') {
            startDrag(body);
        } else {
            holdTimer = setTimeout(() => {
                holdTimer = null;
                startDrag(body);
            }, HOLD_TO_GRAB);
        }
    });

    window.addEventListener('pointermove', event => {
        if (pointer.id === null) {
            if (event.pointerType === 'mouse') {
                pointer.x = event.clientX;
                pointer.y = event.clientY;
                document.documentElement.style.cursor = !isOverControls(event) && bodyAtPointer() ? 'grab' : '';
            }
            return;
        }
        if (event.pointerId !== pointer.id) return;

        // The mouse is moving with no button held: its release went missing
        if (event.pointerType === 'mouse' && event.buttons === 0) {
            endDrag();
            return;
        }

        pointer.x = event.clientX;
        pointer.y = event.clientY;

        // The finger moved before the hold finished: it's a scroll, not a grab
        if (holdTimer && Math.hypot(pointer.x - pointer.startX, pointer.y - pointer.startY) > MOVE_TOLERANCE) {
            endDrag();
        }
    });

    window.addEventListener('pointerup', event => {
        if (event.pointerId === pointer.id) endDrag();
    });
    window.addEventListener('pointercancel', event => {
        if (event.pointerId === pointer.id) endDrag();
    });

    window.addEventListener('blur', endDrag);

    // Stops the browser from selecting text when a press starts on a sticker
    window.addEventListener('mousedown', event => {
        if (dragConstraint) event.preventDefault();
    });

    // Stops the page from scrolling under a sticker that is being dragged
    window.addEventListener('touchmove', event => {
        if (dragConstraint) event.preventDefault();
    }, { passive: false });

    window.addEventListener('contextmenu', event => {
        if (holdTimer || dragConstraint) event.preventDefault();
    });

    Events.on(engine, 'beforeUpdate', () => {
        applyFloating();
        // Keeps the sticker under the pointer, also when the page scrolls during a drag
        if (dragConstraint) {
            dragConstraint.pointA = pointerOnPage();
            limitSpeed(dragConstraint.bodyB, MAX_DRAG_SPEED);
        }
    });
}

// --- Device Orientation (Gyroscope) ---
function setupControls() {
    if (navigator.maxTouchPoints > 0 && typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        // Display info message for permission
        const info = document.createElement('div');
        info.id = 'gyro-info'; // Styled in styles.css
        info.innerText = 'Tap to enable gyroscope control (if available)';
        document.body.appendChild(info);

        // Only a tap on the message itself asks, so the first tap on a sticker still grabs it
        info.addEventListener('click', () => {
            info.remove();
            DeviceOrientationEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation);
                    }
                })
                .catch(console.error);
        }, { once: true });
        setTimeout(() => info.remove(), 8000);
    } else if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleOrientation);
    }
}

// Tilting nudges the stickers. It's measured from how the phone is being held, and that
// reference slowly follows the phone, so holding it upright never makes them sink.
const tilt = { x: 0, y: 0 };
let tiltReference = null;

function handleOrientation(event) {
    if (event.gamma === null || event.beta === null) return; // No real sensor
    if (!tiltReference) tiltReference = { x: event.gamma, y: event.beta };
    tiltReference.x += (event.gamma - tiltReference.x) * 0.01;
    tiltReference.y += (event.beta - tiltReference.y) * 0.01;
    tilt.x = clamp((event.gamma - tiltReference.x) / 45, -1, 1);
    tilt.y = clamp((event.beta - tiltReference.y) / 45, -1, 1);
}

// --- Grid Position Calculation ---
// Columns follow the screen width, and each row is as tall as its tallest sticker and text
function getGridLayout(width) {
    const smallScreen = width < 600;
    const gutter = width >= 1280 ? width * 0.03 + 120 : clamp(width * 0.05, 16, 96); // Wide screens: clears the side buttons
    const columnGap = clamp(width * 0.03, 16, 48);
    const minCellWidth = smallScreen ? 150 : 210;
    const usableWidth = width - gutter * 2;
    const cols = Math.max(Math.floor((usableWidth + columnGap) / (minCellWidth + columnGap)), 1);
    const cellWidth = (usableWidth - columnGap * (cols - 1)) / cols;
    return { smallScreen, gutter, columnGap, cols, cellWidth, numberSize: clamp(cellWidth * 0.26, 32, 68) };
}

// The Who and The What use the same size as the numbers on the grid page
function updateTitleSize() {
    const { numberSize } = getGridLayout(getPageWidth());
    document.documentElement.style.setProperty('--number-size', `${numberSize}px`);
}

function calculateGridPositions() {
    const { smallScreen, gutter, columnGap, cols, cellWidth, numberSize } = getGridLayout(pageWidth);
    const rowGap = clamp(pageWidth * 0.04, 28, 64);

    const textSize = smallScreen ? 12 : 14;
    const lineHeight = smallScreen ? 16 : 20;
    const labelGap = 10;
    const gridSide = cellWidth * 0.72; // Bigger than floating, but the same logic: equal area

    ctx.save();
    ctx.font = `${textSize}px kb`; // Set font before measuring text for accuracy in wrapText

    const positions = new Map();
    let rowTop = filterBar.offsetHeight + 24;

    const visible = visibleBodies();
    for (let start = 0; start < visible.length; start += cols) {
        const row = visible.slice(start, start + cols);
        const stickersTop = rowTop + numberSize + labelGap;
        let rowHeight = 0;

        row.forEach((body, col) => {
            const size = body.renderImg;
            const ideal = fitToArea(size.width / size.height, gridSide);
            // Only the most extreme shapes shrink further, to stay inside their column
            const fit = Math.min(1, cellWidth / ideal.width, cellWidth * 1.2 / ideal.height, size.img.naturalWidth / ideal.width);
            const gridWidth = ideal.width * fit;
            const gridHeight = ideal.height * fit;
            const lines = wrapText(ctx, size.description, cellWidth);

            size.grid = {
                gridWidth, gridHeight, cellWidth, lines, numberSize, textSize, lineHeight, labelGap,
                belowHeight: lines.length * lineHeight
            };

            positions.set(body, {
                x: gutter + col * (cellWidth + columnGap) + cellWidth / 2,
                y: stickersTop + gridHeight / 2
            });

            rowHeight = Math.max(rowHeight, gridHeight + labelGap + lines.length * lineHeight);
        });

        rowTop = stickersTop + rowHeight + rowGap;
    }

    ctx.restore();

    const bottomBar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bottom-bar-height')) || 0;
    positions.pageHeight = Math.ceil(rowTop + bottomBar);
    return positions;
}

function placeOnGrid(positions) {
    setPageHeight(positions.pageHeight);
    positions.forEach((position, body) => {
        const size = body.renderImg;
        Body.setPosition(body, position);
        Body.setAngle(body, 0);
        size.drawWidth = size.grid.gridWidth;
        size.drawHeight = size.grid.gridHeight;
    });
    labelOpacity = 1;
}

function organizeIntoGrid() {
    isGridMode = true; // Set flag to true
    endDrag();
    content.classList.add('is-hidden'); // The text makes way for the grid
    organizeButton.setAttribute('aria-pressed', 'true');
    window.scrollTo(0, 0);
    animateToGrid(); // Call the animation function
}

function animateToGrid() {
    const positions = calculateGridPositions();
    setPageHeight(positions.pageHeight);

    const duration = 2000; // Duration of the animation in milliseconds
    const startTime = performance.now();

    const moves = [];
    positions.forEach((target, body) => {
        const size = body.renderImg;
        setFrozen(body, true);
        moves.push({
            body, target,
            startX: body.position.x,
            startY: body.position.y,
            startAngle: body.angle,
            startWidth: size.drawWidth,
            startHeight: size.drawHeight
        });
    });

    cancelAnimationFrame(gridAnimationId);

    function animate() {
        const elapsedTime = performance.now() - startTime;
        const progress = Math.min(elapsedTime / duration, 1); // Ensure progress does not exceed 1
        const eased = 1 - Math.pow(1 - progress, 3); // Fast start, soft landing

        moves.forEach(move => {
            const size = move.body.renderImg;
            Body.setPosition(move.body, {
                x: move.startX + (move.target.x - move.startX) * eased,
                y: move.startY + (move.target.y - move.startY) * eased
            });
            Body.setAngle(move.body, move.startAngle * (1 - eased));
            size.drawWidth = move.startWidth + (size.grid.gridWidth - move.startWidth) * eased;
            size.drawHeight = move.startHeight + (size.grid.gridHeight - move.startHeight) * eased;
        });
        labelOpacity = eased;

        if (progress < 1) {
            gridAnimationId = requestAnimationFrame(animate); // Continue the animation
        }
    }

    labelOpacity = 0;
    gridAnimationId = requestAnimationFrame(animate);
}

// --- Reset to Chaos Mode ---
function resetPositions() {
    isGridMode = false; // Set flag to false
    cancelAnimationFrame(gridAnimationId);
    endDrag();

    content.classList.remove('is-hidden');
    organizeButton.setAttribute('aria-pressed', 'false');

    bodies.forEach(body => {
        const size = body.renderImg;
        size.drawWidth = size.width;
        size.drawHeight = size.height;
        size.grid = null;
        setFrozen(body, Boolean(size.hidden)); // Filtered-out stickers stay frozen
    });

    setPageHeight(getChaosPageHeight());
    scatterBodies(); // Re-randomize positions for chaos
    window.scrollTo(0, 0);
}

// --- Favourites Camera ---
// Rebuilds what is visible inside the square at that moment: grid, frame and stickers
const PHOTO_SCALE = 2; // Twice the on-screen size, so the saved picture stays sharp
const PHOTO_FILE_NAME = 'city-stickers-favourites.png';

const favouritesFrame = document.getElementById('favourites-frame');
const captureStatus = document.getElementById('capture-status');
let gridImagePromise = null;
let statusTimer = null;

function loadGridImage() {
    if (!gridImagePromise) {
        gridImagePromise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = 'png/grid img small.jpg'; // A full-size copy of the background could run a phone out of memory
        });
    }
    return gridImagePromise;
}

function rectOnPage(element) {
    const rect = element.getBoundingClientRect();
    return {
        left: rect.left,
        top: rect.top + window.scrollY,
        right: rect.right,
        bottom: rect.bottom + window.scrollY,
        width: rect.width,
        height: rect.height
    };
}

// The frame plus the corner squares that stick out of it, with a small margin around them
function getPhotoArea() {
    const margin = 8;
    const corners = [...favouritesFrame.querySelectorAll('.corner')].map(rectOnPage);
    const left = Math.min(...corners.map(corner => corner.left)) - margin;
    const top = Math.min(...corners.map(corner => corner.top)) - margin;
    const right = Math.max(...corners.map(corner => corner.right)) + margin;
    const bottom = Math.max(...corners.map(corner => corner.bottom)) + margin;
    return { left, top, width: right - left, height: bottom - top };
}

// Same placement as the background in styles.css: at least 800px wide, centered, repeating downwards
function drawGridBackground(target, area, gridImage) {
    target.fillStyle = '#fff';
    target.fillRect(area.left, area.top, area.width, area.height);

    const width = Math.max(pageWidth, 800);
    const height = width * gridImage.naturalHeight / gridImage.naturalWidth;
    const x = (pageWidth - width) / 2;
    const firstRow = Math.floor(area.top / height);
    target.save();
    target.globalAlpha = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--background-opacity'));
    for (let row = firstRow; row * height < area.top + area.height; row++) {
        target.drawImage(gridImage, x, row * height, width, height);
    }
    target.restore();
}

function drawBox(target, element) {
    const rect = rectOnPage(element);
    const style = getComputedStyle(element);
    const border = parseFloat(style.borderTopWidth);
    target.strokeStyle = style.borderTopColor;
    target.lineWidth = border;
    target.strokeRect(rect.left + border / 2, rect.top + border / 2, rect.width - border, rect.height - border);
}

function drawFavouritesFrame(target) {
    drawBox(target, favouritesFrame);

    favouritesFrame.querySelectorAll('.corner').forEach(corner => {
        const rect = rectOnPage(corner);
        target.fillStyle = '#fff';
        target.fillRect(rect.left, rect.top, rect.width, rect.height);
        drawBox(target, corner);
    });

    const crosshair = rectOnPage(favouritesFrame.querySelector('.crosshair'));
    const armLength = crosshair.width * 0.4;
    const centerX = crosshair.left + crosshair.width / 2;
    const centerY = crosshair.top + crosshair.height / 2;
    target.fillStyle = getComputedStyle(favouritesFrame).borderTopColor;
    target.fillRect(centerX - 0.5, crosshair.top, 1, armLength);
    target.fillRect(centerX - 0.5, crosshair.bottom - armLength, 1, armLength);
    target.fillRect(crosshair.left, centerY - 0.5, armLength, 1);
    target.fillRect(crosshair.right - armLength, centerY - 0.5, armLength, 1);
}

function touchesArea(body, area) {
    const { min, max } = body.bounds;
    return max.x > area.left && min.x < area.left + area.width
        && max.y > area.top && min.y < area.top + area.height;
}

function canvasToBlob(photo) {
    return new Promise((resolve, reject) => {
        photo.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Empty picture'))), 'image/png');
    });
}

// Phones get the share sheet, which can save straight to the photo library. Everything else downloads.
async function deliverPhoto(blob) {
    const file = new File([blob], PHOTO_FILE_NAME, { type: 'image/png' });
    if (navigator.maxTouchPoints > 0 && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
    }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = PHOTO_FILE_NAME;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function showCaptureStatus(text) {
    captureStatus.textContent = text;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
        captureStatus.textContent = '';
    }, 4000);
}

async function captureFavourites() {
    favouritesFrame.classList.remove('is-flashing');
    void favouritesFrame.offsetWidth; // Restarts the flash on quick repeat clicks
    favouritesFrame.classList.add('is-flashing');

    const area = getPhotoArea();
    const stickers = visibleBodies().filter(body => touchesArea(body, area)); // Frozen at the moment of the click

    try {
        const gridImage = await loadGridImage();
        const photo = document.createElement('canvas');
        photo.width = Math.round(area.width * PHOTO_SCALE);
        photo.height = Math.round(area.height * PHOTO_SCALE);

        // From here on, drawing uses the same page coordinates as everything else
        const target = photo.getContext('2d');
        target.setTransform(PHOTO_SCALE, 0, 0, PHOTO_SCALE, -area.left * PHOTO_SCALE, -area.top * PHOTO_SCALE);

        drawGridBackground(target, area, gridImage);
        drawFavouritesFrame(target);
        stickers.forEach(body => drawSticker(body, target));

        await deliverPhoto(await canvasToBlob(photo));
        showCaptureStatus('<saved!>');
    } catch (error) {
        if (error.name === 'AbortError') return; // Closed the share sheet without saving
        console.error(error);
        // Browsers block saving pictures from a page opened as a local file
        showCaptureStatus(error.name === 'SecurityError'
            ? '<can\'t save here: open the site from its web address>'
            : '<couldn\'t save, try again>');
    }
}

// --- Category Filtering ---
function filterByCategory(selectedCategory) {
    activeCategory = selectedCategory;
    endDrag();

    document.querySelectorAll('#filter-bar button').forEach(button => {
        button.setAttribute('aria-pressed', String(button.getAttribute('data-category') === selectedCategory));
    });

    bodies.forEach(body => {
        const visible = selectedCategory === 'all' || body.renderImg.category === selectedCategory;
        body.renderImg.hidden = !visible; // Track visibility for rendering
        body.collisionFilter.mask = visible ? 0xFFFFFFFF : 0; // Hidden stickers don't bump into visible ones
        if (!isGridMode) setFrozen(body, !visible); // Freeze if hidden
    });

    if (isGridMode) animateToGrid(); // Close the gaps left by the hidden stickers
}

// --- Typewriter ---
// The text is always in the page, invisible at first, so it keeps its exact space and
// nothing moves while it types. Once a section has been typed, it stays.
const TYPING_SPEED = 90; // Characters per second

const typewriterSections = [
    { title: 'what-title', blocks: '.what-columns p' },
    { title: 'who-title', blocks: '.who .quote' }
];

function prepareTypewriter(section) {
    const pieces = [];
    document.querySelectorAll(section.blocks).forEach(block => {
        const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
        const textNodes = [];
        while (walker.nextNode()) {
            if (walker.currentNode.nodeValue.trim()) textNodes.push(walker.currentNode);
        }
        textNodes.forEach(node => {
            const typed = document.createElement('span');
            const untyped = document.createElement('span');
            untyped.className = 'untyped';
            untyped.textContent = node.nodeValue;
            node.replaceWith(typed, untyped);
            pieces.push({ text: node.nodeValue, typed, untyped });
        });
    });
    return pieces;
}

function finishPiece(piece) {
    piece.typed.classList.remove('is-typing');
    piece.untyped.remove();
    piece.typed.replaceWith(document.createTextNode(piece.text)); // Back to plain text, as if never split
}

function typeSection(pieces) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        pieces.forEach(finishPiece);
        return;
    }

    const startTime = performance.now();
    let current = 0;
    let charsBefore = 0; // Characters in the pieces already finished

    function step(now) {
        const charsTyped = Math.floor((now - startTime) / 1000 * TYPING_SPEED);

        while (current < pieces.length && charsTyped >= charsBefore + pieces[current].text.length) {
            charsBefore += pieces[current].text.length;
            finishPiece(pieces[current]);
            current++;
        }

        if (current < pieces.length) {
            const piece = pieces[current];
            const shown = charsTyped - charsBefore;
            piece.typed.className = 'is-typing';
            piece.typed.textContent = piece.text.slice(0, shown);
            piece.untyped.textContent = piece.text.slice(shown);
            requestAnimationFrame(step);
        }
    }

    requestAnimationFrame(step);
}

function setupTypewriter() {
    typewriterSections.forEach(section => {
        const pieces = prepareTypewriter(section);
        const title = document.getElementById(section.title);
        let started = false;

        const start = () => {
            if (started) return;
            started = true;
            title.classList.add('is-typed');
            typeSection(pieces);
        };

        // Hover with a mouse, tap on a touch screen, or reach it with the keyboard
        title.addEventListener('pointerenter', start);
        title.addEventListener('click', start);
        title.addEventListener('focus', start);
    });
}

// --- Keep the layout in step with the text and the filter bar ---
function setupLayoutObservers() {
    updateTitleSize();
    window.addEventListener('resize', updateTitleSize);

    new ResizeObserver(() => {
        document.documentElement.style.setProperty('--bar-height', `${filterBar.offsetHeight}px`);
    }).observe(filterBar);

    // Text height can change once the fonts arrive
    new ResizeObserver(() => {
        if (!isGridMode && pageWidth && bodies.length) setPageHeight(getChaosPageHeight());
    }).observe(content);
}

setupTypewriter();

// --- Window Load Event ---
window.onload = () => {
    setupLayoutObservers();

    // 1. Preload all images and the canvas fonts, then proceed with setup
    let fontsReady = Promise.all([
        document.fonts.load('14px kb'),
        document.fonts.load('bold 68px test', '0123456789?')
    ]).catch(console.error);

    preloadImages(() => {
        fontsReady.then(() => {
            setup(); // Initialize Matter.js engine, world, and bodies
            setupDragging();

            requestAnimationFrame(render); // Start the custom rendering loop
            const runner = Runner.create();
            Runner.run(runner, engine); // Start the Matter.js physics engine

            // 2. Attach event listeners for buttons
            organizeButton.addEventListener('click', organizeIntoGrid);
            document.getElementById('resetButton').addEventListener('click', resetPositions);

            document.getElementById('capture-button').addEventListener('click', captureFavourites);

            // 3. Attach event listeners for filter buttons
            document.querySelectorAll('#filter-bar button').forEach(button => {
                button.addEventListener('click', () => {
                    const category = button.getAttribute('data-category');
                    filterByCategory(category);
                });
            });

            // --- Window Resize Event ---
            window.addEventListener('resize', handleResize); // Adjust canvas, stickers and walls on window resize
        });
    });

    // 4. Setup gyroscope controls
    setupControls();
};
