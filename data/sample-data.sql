-- Sample data for BookCritic database
-- Created: 2025-08-26

-- Insert genres
INSERT INTO genres (id, name, description, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Fiction', 'Imaginative storytelling not presented as fact', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Science Fiction', 'Fiction based on scientific discoveries, technology, and their impact', NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'Mystery', 'Fiction dealing with the solution of a crime or puzzle', NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', 'Non-Fiction', 'Prose writing that is based on facts, real events, and real people', NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555555', 'Fantasy', 'Fiction featuring magical and supernatural elements', NOW(), NOW());

-- Insert books
INSERT INTO books (id, title, author, isbn, description, published_date, cover_image_url, created_at, updated_at)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'The Silent Echo', 'Emily Richards', '9781234567897', 'A gripping tale of mystery and suspense set in a small coastal town.', '2023-05-15', 'https://example.com/covers/silent-echo.jpg', NOW(), NOW()),
  ('a2222222-2222-2222-2222-222222222222', 'Beyond the Stars', 'Marcus Chen', '9781234567898', 'An epic space adventure that spans galaxies and civilizations.', '2022-11-03', 'https://example.com/covers/beyond-stars.jpg', NOW(), NOW()),
  ('a3333333-3333-3333-3333-333333333333', 'The Hidden Truth', 'Sophia Williams', '9781234567899', 'A detective story that unravels a decades-old conspiracy.', '2024-01-20', 'https://example.com/covers/hidden-truth.jpg', NOW(), NOW()),
  ('a4444444-4444-4444-4444-444444444444', 'Mindful Living', 'Dr. James Peterson', '9781234567900', 'A practical guide to incorporating mindfulness into everyday life.', '2023-08-12', 'https://example.com/covers/mindful-living.jpg', NOW(), NOW()),
  ('a5555555-5555-5555-5555-555555555555', 'The Enchanted Forest', 'Olivia Green', '9781234567901', 'A magical journey through a forest where nothing is as it seems.', '2022-06-30', 'https://example.com/covers/enchanted-forest.jpg', NOW(), NOW()),
  ('a6666666-6666-6666-6666-666666666666', 'Quantum Leap', 'Dr. Robert Chen', '9781234567902', 'An exploration of quantum physics and its implications for the future.', '2023-03-18', 'https://example.com/covers/quantum-leap.jpg', NOW(), NOW()),
  ('a7777777-7777-7777-7777-777777777777', 'The Last Detective', 'Michael Brown', '9781234567903', 'A noir mystery featuring a detective on his final case before retirement.', '2024-02-05', 'https://example.com/covers/last-detective.jpg', NOW(), NOW()),
  ('a8888888-8888-8888-8888-888888888888', 'History of Innovation', 'Dr. Sarah Johnson', '9781234567904', 'A comprehensive look at major innovations throughout human history.', '2022-09-22', 'https://example.com/covers/history-innovation.jpg', NOW(), NOW()),
  ('a9999999-9999-9999-9999-999999999999', 'Dragon\'s Realm', 'Thomas Wright', '9781234567905', 'A fantasy epic about a kingdom threatened by ancient dragons.', '2023-11-11', 'https://example.com/covers/dragons-realm.jpg', NOW(), NOW()),
  ('b1111111-1111-1111-1111-111111111111', 'Galactic Empire', 'Alexandra Lee', '9781234567906', 'The rise and fall of a vast interstellar civilization.', '2022-12-08', 'https://example.com/covers/galactic-empire.jpg', NOW(), NOW()),
  ('b2222222-2222-2222-2222-222222222222', 'The Perfect Alibi', 'Daniel Wilson', '9781234567907', 'A legal thriller about a seemingly perfect crime.', '2024-03-15', 'https://example.com/covers/perfect-alibi.jpg', NOW(), NOW()),
  ('b3333333-3333-3333-3333-333333333333', 'Sustainable Future', 'Emma Davis', '9781234567908', 'Practical solutions for environmental challenges facing our planet.', '2023-07-20', 'https://example.com/covers/sustainable-future.jpg', NOW(), NOW()),
  ('b4444444-4444-4444-4444-444444444444', 'Wizards of the North', 'Benjamin Harris', '9781234567909', 'A tale of rival wizards in a snow-covered magical land.', '2022-10-05', 'https://example.com/covers/wizards-north.jpg', NOW(), NOW()),
  ('b5555555-5555-5555-5555-555555555555', 'Parallel Worlds', 'Dr. Lisa Zhang', '9781234567910', 'A scientific exploration of multiverse theory and quantum realities.', '2023-09-28', 'https://example.com/covers/parallel-worlds.jpg', NOW(), NOW()),
  ('b6666666-6666-6666-6666-666666666666', 'The Vanishing', 'Christopher Adams', '9781234567911', 'A small town mystery where residents begin disappearing without a trace.', '2024-01-03', 'https://example.com/covers/vanishing.jpg', NOW(), NOW()),
  ('b7777777-7777-7777-7777-777777777777', 'Leadership Principles', 'Dr. Mark Thompson', '9781234567912', 'Key insights into effective leadership in the modern workplace.', '2023-04-12', 'https://example.com/covers/leadership-principles.jpg', NOW(), NOW()),
  ('b8888888-8888-8888-8888-888888888888', 'The Crystal Kingdom', 'Natalie King', '9781234567913', 'A fantasy adventure in a world made entirely of crystal.', '2022-08-17', 'https://example.com/covers/crystal-kingdom.jpg', NOW(), NOW()),
  ('b9999999-9999-9999-9999-999999999999', 'Mars Colony', 'Dr. Andrew Miller', '9781234567914', 'A science fiction novel about the first permanent human settlement on Mars.', '2023-10-10', 'https://example.com/covers/mars-colony.jpg', NOW(), NOW()),
  ('c1111111-1111-1111-1111-111111111111', 'The Forgotten Case', 'Elizabeth Taylor', '9781234567915', 'A cold case reopened after new evidence emerges decades later.', '2024-02-28', 'https://example.com/covers/forgotten-case.jpg', NOW(), NOW()),
  ('c2222222-2222-2222-2222-222222222222', 'Modern Philosophy', 'Dr. Jonathan Black', '9781234567916', 'An accessible introduction to contemporary philosophical thought.', '2023-06-05', 'https://example.com/covers/modern-philosophy.jpg', NOW(), NOW());

-- Insert book-genre relationships
INSERT INTO book_genres (book_id, genre_id)
VALUES
  -- Fiction books
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('a5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111'),
  ('a9999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111'),
  ('b4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111'),
  ('b8888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111'),
  
  -- Science Fiction books
  ('a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222'),
  ('a6666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222'),
  ('b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'),
  ('b5555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222'),
  ('b9999999-9999-9999-9999-999999999999', '22222222-2222-2222-2222-222222222222'),
  
  -- Mystery books
  ('a3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333'),
  ('a7777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333'),
  ('b2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333'),
  ('b6666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333'),
  ('c1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333'),
  
  -- Non-Fiction books
  ('a4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444'),
  ('a8888888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444'),
  ('b3333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444'),
  ('b7777777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444'),
  ('c2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444'),
  
  -- Fantasy books
  ('a5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555'),
  ('a9999999-9999-9999-9999-999999999999', '55555555-5555-5555-5555-555555555555'),
  ('b4444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555'),
  ('b8888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555'),
  
  -- Books with multiple genres
  ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111'),
  ('a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111'),
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('b9999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111'),
  ('a7777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111');
