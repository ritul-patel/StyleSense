-- ═══════════════════════════════════════════════════════════════
-- StyleSense Blog: Batch 2 - 5 New Articles
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Article 1: Skin Tone Color Quiz
INSERT INTO blog_posts (
  title, slug, excerpt, body_md, body_html,
  status, published_at, reading_time, word_count,
  meta_title, meta_description, faq_schema
) VALUES (
  'Skin Tone Color Quiz: Find Your Perfect Palette in Minutes',
  'skin-tone-color-quiz',
  'Take this quick skin tone color quiz to find your undertone and best colors in minutes. No guesswork, no expensive consultation needed.',
  '',
  '',
  'published',
  now() - interval '4 days',
  8,
  2100,
  'Skin Tone Color Quiz | Find Your Best Colors Fast',
  'Take this quick skin tone color quiz to find your undertone and best colors in minutes, no guesswork, no expensive consultation needed.',
  '[
    {"question": "Is a quiz as accurate as a professional color analysis?", "answer": "Not quite. A quiz is a solid starting point, but a proper analysis accounts for more nuance in depth, contrast, and clarity than a short self-assessment can."},
    {"question": "What if I get a different result every time I take the quiz?", "answer": "That usually means lighting is inconsistent between attempts, or your undertone genuinely sits close to neutral. Try to take it at the same time of day, in the same spot."},
    {"question": "Can two people with similar skin depth get completely different quiz results?", "answer": "Yes, easily. Depth and undertone are separate traits—similar depth does not mean similar undertone."},
    {"question": "Does this quiz work for all skin tones, including deep skin?", "answer": "Yes, the vein, jewelry, and sun-reaction tests work across all skin tones, though the paper test can be slightly less dramatic on deeper skin."},
    {"question": "I want a faster, more precise answer than a self-quiz. What should I do?", "answer": "Upload a clear, natural-light photo to StyleSense. It analyzes your actual undertone, depth, and contrast directly and gives you a tailored color palette instantly."}
  ]'::jsonb
);

-- Article 2: Color Analysis for Men
INSERT INTO blog_posts (
  title, slug, excerpt, body_md, body_html,
  status, published_at, reading_time, word_count,
  meta_title, meta_description, faq_schema
) VALUES (
  'Color Analysis for Men: The Complete Style Guide',
  'color-analysis-for-men',
  'Most color analysis content is written for women. Here is a practical, no-fuss guide to finding your best colors as a man, from shirts to suits.',
  '',
  '',
  'published',
  now() - interval '3 days',
  9,
  2300,
  'Color Analysis for Men | Find Your Best Colors',
  'Most color analysis content is written for women. Here is a practical, no-fuss guide to finding your best colors as a man, from shirts to suits.',
  '[
    {"question": "Does color analysis work differently for men than women?", "answer": "No, the underlying science (undertone, depth, contrast) is identical. Only the garment categories and cultural norms around color choice differ."},
    {"question": "Is it worth applying this to just casualwear, or should I bother with formalwear too?", "answer": "Both benefit, but formalwear tends to show the biggest visible difference since it is usually more photographed and scrutinized."},
    {"question": "What if my job requires a specific uniform or dress code color I cannot change?", "answer": "Focus your undertone-matching effort on the parts you can control—ties, accessories, or a jacket worn over the uniform."},
    {"question": "Should I match my undertone for accessories like watches and belts too?", "answer": "It helps, though the effect is smaller than clothing near your face. Gold-toned accessories for warm undertones and silver-toned for cool is a good default."},
    {"question": "How can I get a precise answer instead of guessing from general guidelines?", "answer": "A photo-based analysis removes the guesswork entirely. StyleSense analyzes your actual skin tone and undertone from a photo and gives you a tailored palette."}
  ]'::jsonb
);

-- Article 3: Wedding Guest Outfit Colors
INSERT INTO blog_posts (
  title, slug, excerpt, body_md, body_html,
  status, published_at, reading_time, word_count,
  meta_title, meta_description, faq_schema
) VALUES (
  'Best Wedding Guest Outfit Colors for Every Skin Tone',
  'wedding-guest-outfit-colors-by-skin-tone',
  'Not sure what color to wear to a wedding? Find the most flattering wedding guest outfit colors for your specific skin tone and undertone.',
  '',
  '',
  'published',
  now() - interval '2 days',
  10,
  2500,
  'Wedding Guest Outfit Colors by Skin Tone | Full Guide',
  'Not sure what color to wear to a wedding? Find the most flattering wedding guest outfit colors for your specific skin tone and undertone.',
  '[
    {"question": "Is it ever okay for a guest to wear white to a wedding?", "answer": "This depends heavily on cultural and regional norms. In many contexts white or ivory is reserved for the bride. When in doubt, ask the couple or check the invitation."},
    {"question": "Do these color rules change for daytime versus evening weddings?", "answer": "The undertone logic stays the same, but evening venue lighting can shift how a color reads more dramatically than natural daylight."},
    {"question": "What if the wedding has an assigned color theme that does not suit my undertone?", "answer": "Work within the assigned color family but choose the specific shade that leans closest to your undertone."},
    {"question": "Should men worry about undertone for wedding outfits too?", "answer": "Yes, the same logic applies to sherwanis, kurtas, and suits. Gold accents for warm undertones and silver for cool is a solid general rule."},
    {"question": "How do I quickly figure out my best wedding colors without a lot of research?", "answer": "Uploading a clear photo to StyleSense gives you a personalized palette based on your actual undertone and skin tone."}
  ]'::jsonb
);

-- Article 4: Foundation Shade Guide
INSERT INTO blog_posts (
  title, slug, excerpt, body_md, body_html,
  status, published_at, reading_time, word_count,
  meta_title, meta_description, faq_schema
) VALUES (
  'How to Choose Foundation Shade for Your Skin Tone and Undertone',
  'foundation-shade-for-skin-tone',
  'Tired of foundation that oxidizes or looks ashy? Learn how to match foundation shade to your exact skin tone and undertone, step by step.',
  '',
  '',
  'published',
  now() - interval '1 day',
  9,
  2200,
  'Foundation Shade Guide by Skin Tone and Undertone',
  'Tired of foundation that oxidizes or looks ashy? Learn how to match foundation shade to your exact skin tone and undertone, step by step.',
  '[
    {"question": "Why does my foundation look fine at the store but wrong at home?", "answer": "Store lighting is often warm and flattering by design, which can mask a slight undertone mismatch that becomes obvious in daylight."},
    {"question": "Is foundation undertone the same as clothing undertone?", "answer": "Yes, it is the same warm, cool, or neutral classification based on your skin pigmentation, so knowing one helps inform the other."},
    {"question": "Can my foundation shade change with the seasons?", "answer": "Depth can shift slightly with tanning or reduced sun exposure, but undertone stays stable. You may need a lighter or darker version of your same undertone match."},
    {"question": "What if a brand does not offer my exact undertone and depth combination?", "answer": "Mix two shades—a slightly warmer and slightly cooler version of similar depth—to custom-blend your match."},
    {"question": "Is there a faster way to know my exact undertone before shopping for foundation?", "answer": "Yes, uploading a clear, makeup-free photo to StyleSense analyzes your specific skin undertone and depth, giving you a reliable starting point."}
  ]'::jsonb
);

-- Article 5: Colors to Avoid
INSERT INTO blog_posts (
  title, slug, excerpt, body_md, body_html,
  status, published_at, reading_time, word_count,
  meta_title, meta_description, faq_schema
) VALUES (
  'Colors to Avoid Based on Your Skin Tone (And What to Wear Instead)',
  'colors-to-avoid-for-skin-tone',
  'Some colors quietly work against you. Find out which shades to approach carefully for your skin tone, and the better alternatives to reach for instead.',
  '',
  '',
  'published',
  now(),
  9,
  2400,
  'Colors to Avoid for Your Skin Tone | What to Wear Instead',
  'Some colors quietly work against you. Find out which shades to approach carefully for your skin tone, and the better alternatives to reach for instead.',
  '[
    {"question": "If a color is on my avoid list, does that mean I look bad in it no matter what?", "answer": "No, it usually just means the color needs more intentional styling—moved away from your face, paired with a flattering neutral, or adjusted in saturation."},
    {"question": "Why does a color look fine in the mirror but off in photos?", "answer": "Cameras and screens can slightly exaggerate undertone clashes that are more subtle in person, especially under mixed lighting."},
    {"question": "Can makeup help offset a clashing clothing color?", "answer": "To a small extent, a flattering lip or blush shade can help balance your overall look, but it will not fully counteract a strong clash at your neckline."},
    {"question": "Is there a color that clashes with literally everyone?", "answer": "Not really. Every color has a version that works for someone—it is about finding the right undertone-matched shade within that color family."},
    {"question": "How do I find out exactly which colors clash with my specific coloring?", "answer": "A tailored analysis based on your actual photo accounts for your specific undertone, depth, and contrast together. StyleSense analyzes this directly."}
  ]'::jsonb
);
