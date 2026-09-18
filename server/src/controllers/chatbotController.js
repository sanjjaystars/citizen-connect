const { query } = require('../db/db');
const { answerCivicGuidance } = require('../services/aiService');

async function askChatbot(req, res) {
  try {
    const userId = req.user?.id || null;
    const { query: queryText, history = [] } = req.body;

    if (!queryText || queryText.trim().length === 0) {
      return res.status(400).json({ error: 'Query text is required' });
    }

    const aiResponse = await answerCivicGuidance(queryText, history);

    // Save to chat_logs table
    await query(
      `INSERT INTO chat_logs (user_id, query, response) VALUES ($1, $2, $3)`,
      [userId, queryText, aiResponse.reply]
    ).catch((err) => console.warn('Failed to log chat:', err.message));

    return res.json({
      success: true,
      query: queryText,
      response: aiResponse.reply,
      source: aiResponse.source,
      suggestedTopics: aiResponse.suggestedTopics
    });
  } catch (err) {
    console.error('askChatbot error:', err);
    return res.status(500).json({ error: 'Failed to process chat query' });
  }
}

async function getChatHistory(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.json({ success: true, history: [] });
    }

    const result = await query(
      `SELECT id, query, response, created_at
       FROM chat_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );

    return res.json({
      success: true,
      history: result.rows.reverse()
    });
  } catch (err) {
    console.error('getChatHistory error:', err);
    return res.status(500).json({ error: 'Failed to fetch chat history' });
  }
}

module.exports = {
  askChatbot,
  getChatHistory,
};
