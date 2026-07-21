const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const required = (name) => { const value = process.env[name]; if (!value) throw new Error(`${name} is required`); return value; };

const pool = new Pool({
  host: required('DB_HOST'), port: Number(required('DB_PORT')), database: required('DB_NAME'), user: required('DB_USER'), password: required('DB_PASSWORD'),
});

async function seed() {
  if (process.env.ALLOW_DESTRUCTIVE_DEMO_SEED !== 'true' || process.env.NODE_ENV === 'production') throw new Error('destructive demo seed is disabled');
  if (!process.env.DEMO_ADMIN_PASSWORD) throw new Error('DEMO_ADMIN_PASSWORD is required for demo seeding');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Drop existing tables
    await client.query(`
      DROP TABLE IF EXISTS users, rides, shows, restaurants, attractions, events, gift_shops, facilities, park_zones, tickets CASCADE;
    `);

    // Create tables
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'guest',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE rides (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        zone VARCHAR(100),
        wait_time INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'open',
        thrill_level VARCHAR(50) DEFAULT 'medium',
        min_height INTEGER DEFAULT 0,
        duration VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE shows (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        zone VARCHAR(100),
        show_times TEXT,
        duration VARCHAR(50),
        venue VARCHAR(255),
        capacity INTEGER DEFAULT 200,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE restaurants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        zone VARCHAR(100),
        cuisine_type VARCHAR(100),
        price_range VARCHAR(10) DEFAULT '$$',
        hours VARCHAR(100),
        seating_capacity INTEGER DEFAULT 100,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE attractions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        zone VARCHAR(100),
        type VARCHAR(100) DEFAULT 'interactive',
        age_group VARCHAR(100) DEFAULT 'all ages',
        duration VARCHAR(50),
        capacity INTEGER DEFAULT 50,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE events (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        zone VARCHAR(100),
        event_date DATE,
        start_time VARCHAR(20),
        end_time VARCHAR(20),
        capacity INTEGER DEFAULT 500,
        event_type VARCHAR(50) DEFAULT 'special',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE gift_shops (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        zone VARCHAR(100),
        specialty VARCHAR(255),
        hours VARCHAR(100),
        price_range VARCHAR(10) DEFAULT '$$',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE facilities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        zone VARCHAR(100),
        facility_type VARCHAR(100) DEFAULT 'general',
        hours VARCHAR(100),
        accessibility BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE park_zones (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        theme VARCHAR(255),
        hours VARCHAR(100),
        highlights TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE tickets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2),
        ticket_type VARCHAR(50) DEFAULT 'standard',
        valid_days INTEGER DEFAULT 1,
        includes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Seed Users
    const hashedPassword = await bcrypt.hash(process.env.DEMO_ADMIN_PASSWORD, 10);
    await client.query(`
      INSERT INTO users (email, password, name, role) VALUES
      ('admin@adventurekingdom.com', '${hashedPassword}', 'Park Admin', 'admin'),
      ('guest@adventurekingdom.com', '${hashedPassword}', 'Guest User', 'guest'),
      ('manager@adventurekingdom.com', '${hashedPassword}', 'Park Manager', 'manager');
    `);

    // Seed Rides (16 items)
    await client.query(`
      INSERT INTO rides (name, description, zone, wait_time, status, thrill_level, min_height, duration) VALUES
      ('Thunder Mountain', 'A thrilling roller coaster through a volcanic mountain with loops and drops', 'Adventure Valley', 45, 'open', 'extreme', 120, '4 min'),
      ('Dragon''s Fury', 'Multi-inversion coaster reaching speeds of 70mph through dragon-themed tunnels', 'Fantasy Kingdom', 60, 'open', 'extreme', 130, '3 min'),
      ('Splash Canyon', 'Water ride through rapids and waterfalls ending with a massive splash drop', 'Tropical Cove', 30, 'open', 'high', 100, '8 min'),
      ('Sky Glider', 'Gentle aerial gondola ride with panoramic views of the entire park', 'Cloud Heights', 15, 'open', 'low', 0, '12 min'),
      ('Pirate''s Revenge', 'Swinging ship ride that reaches 75 degrees and simulates stormy seas', 'Buccaneer Bay', 25, 'open', 'high', 100, '3 min'),
      ('Enchanted Carousel', 'Classic double-decker carousel with hand-painted mythical creatures', 'Fantasy Kingdom', 10, 'open', 'low', 0, '4 min'),
      ('Wild West Express', 'Family mine train coaster through an old western ghost town', 'Frontier Land', 35, 'open', 'medium', 90, '5 min'),
      ('Aqua Vortex', 'Spinning water ride with geysers and tidal wave effects', 'Tropical Cove', 40, 'open', 'high', 100, '6 min'),
      ('Space Warp', 'Indoor dark coaster through a simulated intergalactic journey', 'Future World', 50, 'open', 'extreme', 120, '4 min'),
      ('Bumper Cars Galaxy', 'Electric bumper cars in a neon-lit space arena', 'Future World', 15, 'open', 'low', 80, '5 min'),
      ('Jungle River Cruise', 'Scenic boat ride through animatronic jungle scenes with exotic animals', 'Tropical Cove', 20, 'open', 'low', 0, '15 min'),
      ('Tower of Terror', 'Free-fall drop tower from 200 feet with stunning views before the plunge', 'Adventure Valley', 55, 'open', 'extreme', 130, '2 min'),
      ('Fairy Tale Boats', 'Gentle boat ride through scenes from classic fairy tales', 'Fantasy Kingdom', 10, 'open', 'low', 0, '10 min'),
      ('Twister', 'Spinning flat ride that tilts and rotates at variable speeds', 'Adventure Valley', 20, 'open', 'medium', 100, '3 min'),
      ('Go-Kart Speedway', 'Formula-style go-kart racing on a professional track', 'Frontier Land', 30, 'open', 'medium', 110, '7 min'),
      ('Haunted Manor', 'Dark ride through a spooky Victorian haunted house with live actors', 'Mystery Hollow', 25, 'open', 'medium', 0, '8 min')
      ;
    `);

    // Seed Shows (16 items)
    await client.query(`
      INSERT INTO shows (name, description, zone, show_times, duration, venue, capacity) VALUES
      ('Dragon''s Fire Spectacular', 'Breathtaking fire and pyrotechnics show featuring animatronic dragons', 'Fantasy Kingdom', '12:00 PM, 3:00 PM, 7:00 PM', '25 min', 'Dragon Arena', 2000),
      ('Pirates of the Seven Seas', 'Live stunt show with sword fights, cannon blasts, and diving', 'Buccaneer Bay', '11:00 AM, 2:00 PM, 5:00 PM', '30 min', 'Pirate Cove Theater', 1500),
      ('Magic & Illusions Show', 'World-class magician performing mind-bending illusions', 'Fantasy Kingdom', '1:00 PM, 4:00 PM, 8:00 PM', '45 min', 'Grand Magic Theater', 800),
      ('Jungle Beat Drumming', 'Interactive percussion show with audience participation', 'Tropical Cove', '10:30 AM, 1:30 PM, 4:30 PM', '20 min', 'Jungle Stage', 400),
      ('Space Commander 4D', '4D movie experience with motion seats and special effects', 'Future World', '10:00 AM - 8:00 PM (every 30 min)', '15 min', 'Space Theater', 200),
      ('Western Rodeo Show', 'Trick riding, lasso demonstrations, and bull riding stunts', 'Frontier Land', '11:30 AM, 3:30 PM', '35 min', 'Rodeo Arena', 1000),
      ('Enchanted Princess Meet', 'Meet and greet with fairy tale princesses with story time', 'Fantasy Kingdom', '10:00 AM - 6:00 PM (continuous)', '15 min', 'Royal Palace', 50),
      ('Acrobatic Cirque Show', 'Aerial acrobatics and contortion acts under the big top', 'Cloud Heights', '12:30 PM, 5:30 PM, 8:30 PM', '40 min', 'Grand Circus Tent', 1200),
      ('Underwater World Show', 'Synchronized swimmers and divers in a massive aquarium tank', 'Tropical Cove', '11:00 AM, 2:30 PM, 6:00 PM', '25 min', 'Ocean Theater', 600),
      ('Laser Light Finale', 'End-of-day laser, fireworks, and drone light show', 'Cloud Heights', '9:30 PM', '20 min', 'Central Lake', 5000),
      ('Comedy & Juggling Street Show', 'Roaming comedians and jugglers performing impromptu acts', 'Frontier Land', '10:00 AM - 8:00 PM', '10 min', 'Main Street', 100),
      ('Haunted Tales', 'Spooky storytelling experience in a dimly lit crypt', 'Mystery Hollow', '12:00 PM, 3:00 PM, 6:00 PM, 8:00 PM', '20 min', 'Crypt Theater', 150),
      ('Robot Dance Party', 'Interactive dance show with humanoid robots and DJ', 'Future World', '11:00 AM, 2:00 PM, 5:00 PM, 7:00 PM', '25 min', 'Neon Stage', 500),
      ('Birds of Paradise', 'Exotic bird show featuring trained parrots, eagles, and owls', 'Tropical Cove', '10:30 AM, 1:00 PM, 4:00 PM', '30 min', 'Aviary Amphitheater', 350),
      ('Medieval Jousting Tournament', 'Knights on horseback competing in jousting and combat', 'Fantasy Kingdom', '12:00 PM, 4:00 PM', '45 min', 'Tournament Grounds', 800),
      ('Bubble Wonderland', 'Mesmerizing giant bubble artistry show for all ages', 'Fantasy Kingdom', '10:00 AM, 12:30 PM, 3:30 PM', '15 min', 'Fairy Garden Stage', 200)
      ;
    `);

    // Seed Restaurants (16 items)
    await client.query(`
      INSERT INTO restaurants (name, description, zone, cuisine_type, price_range, hours, seating_capacity) VALUES
      ('Dragon''s Feast Hall', 'Medieval-themed dining with jousting entertainment and turkey legs', 'Fantasy Kingdom', 'American', '$$$', '11:00 AM - 9:00 PM', 300),
      ('Pirate''s Galley', 'Seafood restaurant built inside a full-scale pirate ship', 'Buccaneer Bay', 'Seafood', '$$$', '11:00 AM - 10:00 PM', 200),
      ('Cosmic Burger Station', 'Space-themed fast food with gourmet burgers and shakes', 'Future World', 'American', '$$', '10:00 AM - 9:00 PM', 150),
      ('Tropical Tiki Bar & Grill', 'Beachside dining with grilled specialties and tropical cocktails', 'Tropical Cove', 'Caribbean', '$$', '11:00 AM - 10:00 PM', 180),
      ('Frontier Steakhouse', 'Premium steaks and BBQ in an authentic saloon setting', 'Frontier Land', 'BBQ/Steakhouse', '$$$', '11:30 AM - 9:30 PM', 120),
      ('Noodle Pagoda', 'Authentic Asian cuisine with ramen, stir-fry, and dim sum', 'Adventure Valley', 'Asian', '$$', '11:00 AM - 9:00 PM', 140),
      ('Pizza Planet', 'Brick oven pizzas with creative toppings in a fun atmosphere', 'Future World', 'Italian', '$$', '10:30 AM - 9:00 PM', 200),
      ('Ice Cream Dreams', 'Artisan ice cream parlor with 30+ unique flavors', 'Fantasy Kingdom', 'Desserts', '$', '10:00 AM - 10:00 PM', 60),
      ('Safari Snack Shack', 'Quick bites including wraps, salads, and fresh fruit smoothies', 'Tropical Cove', 'Healthy/Quick', '$', '9:00 AM - 8:00 PM', 80),
      ('Castle Café', 'Elegant café inside the castle with pastries, coffee, and light meals', 'Fantasy Kingdom', 'Café/Bakery', '$$', '8:00 AM - 8:00 PM', 100),
      ('Galactic Sushi', 'Conveyor belt sushi restaurant with futuristic presentation', 'Future World', 'Japanese', '$$$', '11:00 AM - 9:00 PM', 90),
      ('Churro Corner', 'Fresh churros with various dipping sauces and toppings', 'Frontier Land', 'Snacks', '$', '10:00 AM - 9:00 PM', 40),
      ('The Brew Haus', 'Craft beer garden with pretzels, bratwurst, and live music', 'Adventure Valley', 'German', '$$', '11:00 AM - 10:00 PM', 250),
      ('Veggie Valley Kitchen', 'Plant-based restaurant with creative vegetarian and vegan dishes', 'Cloud Heights', 'Vegetarian/Vegan', '$$', '10:00 AM - 9:00 PM', 80),
      ('Royal Banquet Hall', 'Fine dining experience with a prix fixe menu and character appearances', 'Fantasy Kingdom', 'Fine Dining', '$$$$', '5:00 PM - 10:00 PM', 150),
      ('Nacho Fiesta', 'Mexican street food with loaded nachos, tacos, and margaritas', 'Frontier Land', 'Mexican', '$$', '10:00 AM - 9:00 PM', 120)
      ;
    `);

    // Seed Attractions (16 items)
    await client.query(`
      INSERT INTO attractions (name, description, zone, type, age_group, duration, capacity) VALUES
      ('Dino Discovery Zone', 'Life-size animatronic dinosaurs in a prehistoric jungle setting', 'Adventure Valley', 'walkthrough', 'all ages', '30 min', 200),
      ('Magic Mirror Maze', 'Disorienting mirror labyrinth with LED light effects', 'Fantasy Kingdom', 'interactive', 'ages 5+', '15 min', 40),
      ('Virtual Reality Space Walk', 'VR experience simulating a spacewalk outside the ISS', 'Future World', 'VR experience', 'ages 10+', '10 min', 20),
      ('Petting Zoo Ranch', 'Interactive animal experience with goats, sheep, and ponies', 'Frontier Land', 'animal encounter', 'all ages', '30 min', 100),
      ('Treehouse Adventure Climb', 'Multi-level treehouse with rope bridges, slides, and nets', 'Tropical Cove', 'playground', 'ages 3-12', '45 min', 80),
      ('Escape Room: Pharaoh''s Tomb', 'Themed escape room where teams solve ancient Egyptian puzzles', 'Mystery Hollow', 'escape room', 'ages 10+', '45 min', 12),
      ('Splash Pad Oasis', 'Interactive water play area with fountains, jets, and water cannons', 'Tropical Cove', 'water play', 'all ages', '60 min', 150),
      ('Mini Golf Kingdom', '18-hole themed mini golf course through fantasy landscapes', 'Fantasy Kingdom', 'mini golf', 'all ages', '45 min', 72),
      ('Rock Climbing Wall', '40-foot climbing wall with routes for beginners to experts', 'Adventure Valley', 'physical activity', 'ages 6+', '20 min', 16),
      ('Laser Tag Arena', 'Two-story laser tag arena with sci-fi theme', 'Future World', 'competitive game', 'ages 7+', '15 min', 30),
      ('Fossil Dig Site', 'Archaeological dig experience where kids uncover replica fossils', 'Adventure Valley', 'educational', 'ages 3-12', '30 min', 40),
      ('Butterfly Garden', 'Walk-through greenhouse with hundreds of free-flying butterflies', 'Cloud Heights', 'nature', 'all ages', '20 min', 60),
      ('Arcade Universe', '200+ arcade games, claw machines, and prize redemption center', 'Future World', 'arcade', 'all ages', '60 min', 300),
      ('Haunted Maze', 'Scare-actor filled maze with multiple paths and dead ends', 'Mystery Hollow', 'walkthrough', 'ages 12+', '15 min', 30),
      ('Train Station Express', 'Scenic train ride around the entire park perimeter', 'Frontier Land', 'scenic ride', 'all ages', '20 min', 80),
      ('Sky Ropes Course', 'Elevated obstacle course with ziplines between platforms', 'Cloud Heights', 'physical activity', 'ages 8+', '30 min', 24)
      ;
    `);

    // Seed Events (16 items)
    await client.query(`
      INSERT INTO events (name, description, zone, event_date, start_time, end_time, capacity, event_type) VALUES
      ('Summer Music Festival', 'Live bands performing on multiple stages throughout the park', 'Cloud Heights', '2026-06-15', '4:00 PM', '11:00 PM', 5000, 'festival'),
      ('Halloween Fright Nights', 'After-dark scare zones, haunted houses, and horror shows', 'Mystery Hollow', '2026-10-15', '7:00 PM', '12:00 AM', 3000, 'seasonal'),
      ('Holiday Winter Wonderland', 'Snow machines, holiday lights, Santa meet & greet, ice skating', 'Fantasy Kingdom', '2026-12-01', '5:00 PM', '10:00 PM', 4000, 'seasonal'),
      ('Character Breakfast Bash', 'Breakfast buffet with meet and greet with all park characters', 'Fantasy Kingdom', '2026-04-10', '8:00 AM', '10:30 AM', 200, 'dining'),
      ('Fireworks Extravaganza', 'Special extended fireworks show with synchronized music', 'Cloud Heights', '2026-07-04', '9:00 PM', '10:00 PM', 10000, 'special'),
      ('5K Fun Run', 'Morning charity fun run through the park before opening', 'Frontier Land', '2026-05-20', '6:00 AM', '8:30 AM', 1000, 'sports'),
      ('Food & Wine Festival', 'International food booths, wine tasting, and cooking demos', 'Tropical Cove', '2026-09-10', '11:00 AM', '9:00 PM', 3000, 'festival'),
      ('Cosplay Convention Day', 'Costume contests, panels, and special character interactions', 'Future World', '2026-08-22', '10:00 AM', '8:00 PM', 2000, 'convention'),
      ('Spring Flower Festival', 'Garden displays, flower arranging workshops, and garden tours', 'Cloud Heights', '2026-04-01', '9:00 AM', '6:00 PM', 2000, 'seasonal'),
      ('New Year''s Eve Countdown', 'Gala dinner, DJ party, and midnight fireworks spectacular', 'Cloud Heights', '2026-12-31', '8:00 PM', '1:00 AM', 5000, 'special'),
      ('Kids Science Fair', 'Interactive science experiments and STEM activities for kids', 'Future World', '2026-03-25', '10:00 AM', '5:00 PM', 500, 'educational'),
      ('Annual Pass Holder Night', 'Exclusive after-hours access for annual pass holders', 'Adventure Valley', '2026-06-01', '7:00 PM', '11:00 PM', 2000, 'exclusive'),
      ('Pirate Treasure Hunt', 'Park-wide scavenger hunt with prizes and pirate-themed clues', 'Buccaneer Bay', '2026-07-20', '10:00 AM', '4:00 PM', 500, 'interactive'),
      ('Drive-In Movie Night', 'Classic movie screening on giant outdoor screen', 'Frontier Land', '2026-08-15', '8:00 PM', '11:00 PM', 400, 'entertainment'),
      ('Easter Egg Hunt', 'Massive Easter egg hunt across all park zones with special prizes', 'Fantasy Kingdom', '2026-04-05', '9:00 AM', '12:00 PM', 1000, 'seasonal'),
      ('Cultural Dance Festival', 'Dance performances from around the world with workshops', 'Tropical Cove', '2026-05-15', '11:00 AM', '7:00 PM', 1500, 'cultural')
      ;
    `);

    // Seed Gift Shops (16 items)
    await client.query(`
      INSERT INTO gift_shops (name, description, zone, specialty, hours, price_range) VALUES
      ('The Enchanted Emporium', 'Flagship store with exclusive park merchandise and collectibles', 'Fantasy Kingdom', 'Exclusive merchandise & collectibles', '9:00 AM - 10:00 PM', '$$$'),
      ('Pirate''s Treasure Chest', 'Pirate-themed gifts, costumes, and toy weapons', 'Buccaneer Bay', 'Pirate costumes & accessories', '9:00 AM - 9:00 PM', '$$'),
      ('Space Station Gift Shop', 'Sci-fi merchandise, NASA-inspired items, and tech gadgets', 'Future World', 'Science & tech gifts', '9:00 AM - 9:00 PM', '$$'),
      ('Frontier Trading Post', 'Western wear, cowboy hats, and handcrafted leather goods', 'Frontier Land', 'Western wear & leather goods', '9:00 AM - 9:00 PM', '$$'),
      ('Tropical Treasures', 'Beach accessories, Hawaiian shirts, and seashell jewelry', 'Tropical Cove', 'Beach & tropical items', '9:00 AM - 9:00 PM', '$$'),
      ('The Crystal Cave', 'Gemstones, crystals, geodes, and jewelry', 'Mystery Hollow', 'Crystals & gemstone jewelry', '10:00 AM - 8:00 PM', '$$$'),
      ('Photo Magic Studio', 'Professional ride photos, green screen photos, and custom souvenirs', 'Fantasy Kingdom', 'Photo souvenirs & custom items', '9:00 AM - 9:00 PM', '$$'),
      ('Candy Kingdom', 'Handmade fudge, candy apples, and custom candy mixes', 'Fantasy Kingdom', 'Handmade candies & sweets', '9:00 AM - 10:00 PM', '$'),
      ('Adventure Outfitters', 'Outdoor gear, park-branded clothing, and adventure accessories', 'Adventure Valley', 'Outdoor gear & clothing', '9:00 AM - 9:00 PM', '$$'),
      ('Toy Box Junction', 'Stuffed animals, action figures, and build-your-own plush station', 'Fantasy Kingdom', 'Toys & plush characters', '9:00 AM - 9:00 PM', '$$'),
      ('The Art Gallery', 'Original park artwork, prints, and custom caricatures', 'Cloud Heights', 'Art prints & caricatures', '10:00 AM - 8:00 PM', '$$$'),
      ('Dino Store', 'Dinosaur toys, fossils, and educational kits', 'Adventure Valley', 'Dinosaur-themed merchandise', '9:00 AM - 9:00 PM', '$$'),
      ('Hat Shack', 'Custom embroidered hats, visors, and headwear', 'Frontier Land', 'Custom hats & headwear', '9:00 AM - 9:00 PM', '$'),
      ('The Magic Wand Shop', 'Interactive magic wands, trick kits, and magician supplies', 'Fantasy Kingdom', 'Magic wands & trick kits', '9:00 AM - 9:00 PM', '$$'),
      ('Souvenir Central', 'Keychains, magnets, mugs, and classic park souvenirs', 'Fantasy Kingdom', 'Classic souvenirs', '8:00 AM - 10:00 PM', '$'),
      ('Pet Pals Shop', 'Pet accessories, toys, and park-branded pet gear', 'Frontier Land', 'Pet accessories & gear', '9:00 AM - 8:00 PM', '$$')
      ;
    `);

    // Seed Facilities (16 items)
    await client.query(`
      INSERT INTO facilities (name, description, zone, facility_type, hours, accessibility) VALUES
      ('Main First Aid Station', 'Full medical staff with emergency care and medication dispensing', 'Fantasy Kingdom', 'first aid', '8:00 AM - 11:00 PM', true),
      ('Adventure First Aid', 'Secondary first aid station near high-thrill rides', 'Adventure Valley', 'first aid', '9:00 AM - 10:00 PM', true),
      ('Family Restrooms - Central', 'Family-sized restrooms with baby changing stations near park center', 'Fantasy Kingdom', 'restroom', '8:00 AM - 11:00 PM', true),
      ('Restrooms - Tropical', 'Clean restrooms with cooling mist fans near water attractions', 'Tropical Cove', 'restroom', '8:00 AM - 11:00 PM', true),
      ('Restrooms - Frontier', 'Themed restrooms with western decor', 'Frontier Land', 'restroom', '8:00 AM - 11:00 PM', true),
      ('Guest Services Center', 'Information desk, lost and found, wheelchair/stroller rentals', 'Fantasy Kingdom', 'guest services', '8:00 AM - 10:00 PM', true),
      ('Locker Rentals - Main', 'Electronic lockers in various sizes for personal belongings', 'Fantasy Kingdom', 'lockers', '8:00 AM - 11:00 PM', true),
      ('Locker Rentals - Water', 'Waterproof lockers near water attractions', 'Tropical Cove', 'lockers', '9:00 AM - 9:00 PM', true),
      ('Baby Care Center', 'Private nursing rooms, microwave, high chairs, and baby supplies', 'Fantasy Kingdom', 'baby care', '8:00 AM - 10:00 PM', true),
      ('ATM - Main Entrance', 'ATM machines accepting all major bank cards', 'Fantasy Kingdom', 'ATM', '24 hours', true),
      ('ATM - Frontier', 'ATM inside the trading post area', 'Frontier Land', 'ATM', '24 hours', true),
      ('Wheelchair Rental Station', 'Electric and manual wheelchairs available for rent', 'Fantasy Kingdom', 'accessibility', '8:00 AM - 10:00 PM', true),
      ('Pet Kennel', 'Climate-controlled pet boarding during your park visit', 'Frontier Land', 'pet care', '8:00 AM - 11:00 PM', true),
      ('Charging Station Hub', 'Free phone and device charging stations with secure locks', 'Future World', 'charging', '8:00 AM - 11:00 PM', true),
      ('Smoking Area - East', 'Designated smoking area with seating near east gate', 'Adventure Valley', 'smoking area', '8:00 AM - 11:00 PM', false),
      ('Lost Children Center', 'Safe waiting area for separated children with entertainment', 'Fantasy Kingdom', 'child safety', '8:00 AM - 11:00 PM', true)
      ;
    `);

    // Seed Park Zones (16 items)
    await client.query(`
      INSERT INTO park_zones (name, description, theme, hours, highlights) VALUES
      ('Fantasy Kingdom', 'The magical heart of the park featuring castles, fairy tales, and enchantment', 'Medieval Fantasy', '9:00 AM - 10:00 PM', 'Enchanted Castle, Dragon Arena, Royal Banquet Hall, Fairy Tale Boats'),
      ('Adventure Valley', 'Rugged terrain with thrilling rides and prehistoric discoveries', 'Jungle/Adventure', '9:00 AM - 10:00 PM', 'Thunder Mountain, Dino Discovery Zone, Rock Climbing Wall'),
      ('Tropical Cove', 'Water attractions and beach vibes with lush tropical landscaping', 'Tropical/Beach', '9:00 AM - 9:00 PM', 'Splash Canyon, Aqua Vortex, Splash Pad Oasis, Tiki Bar'),
      ('Future World', 'Cutting-edge technology, space exploration, and futuristic experiences', 'Sci-Fi/Technology', '9:00 AM - 10:00 PM', 'Space Warp, VR Space Walk, Laser Tag Arena, Robot Dance Party'),
      ('Frontier Land', 'The Wild West comes alive with cowboys, ranches, and frontier fun', 'Western/Frontier', '9:00 AM - 9:00 PM', 'Wild West Express, Go-Kart Speedway, Rodeo Show, Petting Zoo'),
      ('Buccaneer Bay', 'Swashbuckling adventures on the high seas with pirate themes', 'Pirate/Nautical', '9:00 AM - 9:00 PM', 'Pirate''s Revenge, Pirates of Seven Seas Show, Treasure Hunt'),
      ('Cloud Heights', 'Elevated experiences with aerial rides and sky-high entertainment', 'Sky/Cloud', '9:00 AM - 10:00 PM', 'Sky Glider, Cirque Show, Butterfly Garden, Sky Ropes'),
      ('Mystery Hollow', 'Dark and mysterious zone with spooky attractions and thrill experiences', 'Horror/Mystery', '10:00 AM - 10:00 PM', 'Haunted Manor, Escape Room, Haunted Maze, Haunted Tales'),
      ('Main Street Plaza', 'Grand entrance boulevard with shops, dining, and welcome shows', 'Classic Americana', '8:00 AM - 11:00 PM', 'Guest Services, Souvenir Central, Welcome Parade'),
      ('Kiddie Cove', 'Dedicated area for toddlers and young children with gentle rides', 'Playful/Colorful', '9:00 AM - 8:00 PM', 'Mini Carousel, Ball Pit Palace, Toddler Splash Zone'),
      ('Discovery Gardens', 'Educational botanical gardens with interactive nature exhibits', 'Nature/Garden', '9:00 AM - 7:00 PM', 'Butterfly Garden, Flower Festival, Nature Trail'),
      ('Performance Plaza', 'Central entertainment hub with stages and gathering areas', 'Entertainment', '10:00 AM - 10:00 PM', 'Main Stage, Street Performers, Character Meet Points'),
      ('Lakeside Retreat', 'Peaceful waterfront area for relaxation and scenic dining', 'Lakeside/Relaxation', '9:00 AM - 10:00 PM', 'Paddle Boats, Lakeside Cafe, Fireworks Viewing'),
      ('Artisan Quarter', 'Creative zone with craft workshops, art galleries, and maker spaces', 'Creative/Artisan', '10:00 AM - 8:00 PM', 'Glass Blowing, Pottery Studio, Art Gallery'),
      ('Sports Arena', 'Active zone with sports activities, competitions, and fitness fun', 'Sports/Active', '9:00 AM - 9:00 PM', '5K Track, Basketball Courts, Climbing Wall'),
      ('International Village', 'Cultural zone representing cuisines and crafts from around the world', 'Cultural/International', '10:00 AM - 9:00 PM', 'World Food Market, Cultural Dance Stage, Craft Bazaar')
      ;
    `);

    // Seed Tickets (16 items)
    await client.query(`
      INSERT INTO tickets (name, description, price, ticket_type, valid_days, includes) VALUES
      ('Single Day Pass', 'Full access to all rides and attractions for one day', 89.99, 'standard', 1, 'All rides, shows, and attractions'),
      ('Two-Day Explorer', 'Two consecutive days of unlimited park access', 159.99, 'multi-day', 2, 'All rides, shows, and attractions for 2 days'),
      ('Three-Day Adventure', 'Three days of unlimited fun with flexible scheduling', 219.99, 'multi-day', 3, 'All rides, shows, and attractions for 3 days'),
      ('Weekly Unlimited', 'Seven days of unlimited park access', 349.99, 'multi-day', 7, 'All rides, shows, attractions, plus one meal voucher per day'),
      ('Child Day Pass', 'Full day access for children ages 3-9', 69.99, 'child', 1, 'All rides (height permitting), shows, and attractions'),
      ('Senior Day Pass', 'Full day access for guests 65 and older', 59.99, 'senior', 1, 'All rides, shows, attractions, plus priority seating at shows'),
      ('VIP Experience', 'Premium day pass with front-of-line access and exclusive perks', 199.99, 'vip', 1, 'Skip-the-line access, reserved show seating, VIP lounge, complimentary meal'),
      ('Annual Pass - Silver', 'Year-round access on weekdays with basic perks', 399.99, 'annual', 365, 'Weekday access, 10% shop discount, monthly newsletter'),
      ('Annual Pass - Gold', 'Year-round access every day including holidays', 599.99, 'annual', 365, 'Unlimited daily access, 15% shop discount, free parking, birthday perk'),
      ('Annual Pass - Platinum', 'Ultimate annual pass with all premium benefits', 899.99, 'annual', 365, 'Unlimited access, 20% discount everywhere, VIP events, free parking, guest passes'),
      ('Family Four Pack', 'Discounted bundle for a family of four (any ages)', 299.99, 'bundle', 1, 'Four single-day passes, one shared locker, photo package'),
      ('Group Package (10+)', 'Discounted rate for groups of 10 or more guests', 74.99, 'group', 1, 'All rides and shows, dedicated group host, reserved picnic area'),
      ('After 4 PM Pass', 'Discounted evening entry after 4:00 PM', 49.99, 'partial', 1, 'All rides and shows from 4 PM to close'),
      ('Splash Day Pass', 'Access to water attractions and Tropical Cove only', 44.99, 'partial', 1, 'All water rides, Splash Pad, Tropical Cove dining discount'),
      ('Birthday Party Package', 'Private party room, cake, decorations, and park passes for 10', 499.99, 'event', 1, 'Party room for 3 hours, cake, decorations, 10 day passes, character visit'),
      ('Military Appreciation Pass', 'Discounted day pass for active military and veterans', 54.99, 'special', 1, 'All rides, shows, attractions, priority parking')
      ;
    `);

    await client.query('COMMIT');
    console.log('✅ Database seeded successfully with all data!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
