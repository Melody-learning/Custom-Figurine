export const translations = {
  en: {
    // Header
    home: 'Home',
    customize: 'Customize',
    cart: 'Cart',

    // Home Page
    heroTitle: 'Create Your Custom Figurine',
    heroSubtitle: "Upload your photo and we'll transform it into a unique 3D figurine. Premium quality, handcrafted to perfection.",
    startCustomizing: 'Start Customizing',

    // How It Works
    howItWorks: 'How It Works',
    step1Title: '1. Upload Your Photo',
    step1Desc: 'Simply upload any photo and our AI will transform it into a 3D render',
    step2Title: '2. AI Generation',
    step2Desc: 'Our AI generates a stunning 3D-style render for your approval',
    step3Title: '3. Receive Your Figurine',
    step3Desc: "We'll 3D print, paint, and ship your custom figurine to your door",

    // Features
    premiumQuality: 'Premium Quality',
    featuresList: [
      'High-resolution 3D printing',
      'Hand-painted with premium paints',
      'Multiple size options available',
      'Various materials to choose from',
      'Worldwide shipping'
    ],
    perfectGift: 'Perfect Gift',
    giftList: [
      'Unique personalized gift',
      'Ideal for birthdays, anniversaries',
      'Commemorate special moments',
      'Corporate gifts and events',
      'Fan art and character recreations'
    ],

    // CTA
    ctaTitle: 'Ready to Create Your Figurine?',
    ctaSubtitle: 'Start your custom figurine journey today',
    getStarted: 'Get Started',

    // Product Section
    productSection: 'Our Products',
    scenarios: 'Perfect For',
    scenariosList: [
      'Birthday gifts for loved ones',
      'Wedding & anniversary commemorations',
      'Pet portraits preserved forever',
      'Corporate branding & events',
      'Fan art & character collection',
      'Memorial keepsakes'
    ],
    craft: 'Craftsmanship',
    craftList: [
      { title: '3D Printing', desc: 'High-precision SLA/DLP printing' },
      { title: 'Hand Painting', desc: ' Skilled artists hand-paint each piece' },
      { title: 'Quality Check', desc: 'Multi-stage quality inspection' },
      { title: 'Safe Packing', desc: 'Shock-proof packaging for delivery' }
    ],
    process: 'How It\'s Made',
    processList: [
      { title: 'AI Generation', desc: 'Transform your photo into 3D render' },
      { title: '3D Modeling', desc: 'Create precise digital model' },
      { title: '3D Printing', desc: 'Print with high-quality resin' },
      { title: 'Hand Painting', desc: 'Paint with attention to detail' },
      { title: 'Quality Check', desc: 'Ensure perfect quality' },
      { title: 'Shipping', desc: 'Deliver safely to your door' }
    ],
    faq: 'FAQ',
    faqList: [
      { q: 'How long does it take?', a: 'Typically 2-3 weeks including production and shipping' },
      { q: 'What photo should I upload?', a: 'High-resolution, well-lit photos work best. Front-facing images produce the best results.' },
      { q: 'What sizes are available?', a: 'We offer 6cm, 8cm, 10cm, and 15cm options' },
      { q: 'Do you ship internationally?', a: 'Yes, we ship worldwide with tracking' }
    ],

    // Customize Page
    loginRequired: 'Log in or register to initialize the 3D generation pipeline.',
    uploadTitle: 'Upload Your Photo',
    uploadDesc: 'Upload a clear photo of yourself, a pet, or any character you want turned into a figurine',
    uploadHint: 'Click to upload or drag and drop',
    uploadFormat: 'PNG, JPG up to 10MB',
    bgFilterTitle: 'Smart Background Filter',
    bgFilterDesc: 'Automatically remove image background for better results',
    generateBtn: 'Generate 3D Preview',
    generatingTitle: 'Generating Your Preview',
    generatingDesc: 'Our AI is transforming your image into a 3D-style render...',
    chooseOptions: 'Choose Your Options',
    selectProduct: 'Total:',
    continueBtn: 'Continue',
    backBtn: 'Back',

    // Confirm Page
    confirmTitle: 'Confirm Your Order',
    confirmDesc: 'Review your custom figurine before adding to cart',
    originalImage: 'Original Image',
    selectedOptions: 'Selected Options',
    whatHappensNext: 'What Happens Next?',
    steps: [
      "Our team will review your design",
      "We'll 3D print your figurine",
      'Hand-painted with care (if applicable)',
      'Carefully packaged and shipped'
    ],
    addToCart: 'Add to Cart',

    // Cart
    shoppingCart: 'Shopping Cart',
    emptyCart: 'Your cart is empty',
    checkout: 'Checkout',
    processing: 'Processing...',
    checkoutError: 'Checkout failed. Please try again.',
    remove: 'Remove',

    // Footer
    allRightsReserved: 'All rights reserved',
  },
};

export type Language = 'en';
export type TranslationKey = keyof typeof translations.en;

type StringKeys = {
  [K in keyof typeof translations.en]: typeof translations.en[K] extends string ? K : never;
}[keyof typeof translations.en];

export type TranslationStringKey = StringKeys;
