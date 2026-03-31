exports.up = pgm => {
  pgm.createTable('results', {
    id: 'id',
    analysis_id: {   // ✅ changed here
      type: 'integer',
      notNull: true,
      references: '"analyses"',
      onDelete: 'cascade',
    },
    color_profile: { type: 'jsonb', notNull: true }, // ✅ also fix this (important)
    created_at: {   // ✅ better to fix this too
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

exports.down = pgm => {
  pgm.dropTable('results');
};