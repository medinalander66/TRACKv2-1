const { Op } = require('sequelize');
const { EmailQueue } = require('../models');
const { sendEmailNow } = require('./emailService');

const POLL_INTERVAL_MS = 60 * 1000; // 1 minute
let intervalHandle = null;

async function processQueueOnce() {
  try {
    const now = new Date();
    const due = await EmailQueue.findAll({
      where: {
        status: 'pending',
        [Op.or]: [
          { scheduled_for: null },
          { scheduled_for: { [Op.lte]: now } }
        ]
      },
      limit: 20
    });

    for (const item of due) {
      try {
        await sendEmailNow({
          to: item.recipient_email,
          subject: item.subject,
          html: item.body
        });
        item.status = 'sent';
        item.sent_at = new Date();
        item.error_message = null;
        await item.save();
      } catch (err) {
        console.error(`Failed to send queued email ${item.id}:`, err.message);
        item.status = 'failed';
        item.error_message = err.message;
        await item.save();
      }
    }
  } catch (err) {
    console.error('Email queue processing error:', err);
  }
}

exports.start = () => {
  if (intervalHandle) return;
  console.log('Email queue processor started.');
  processQueueOnce();
  intervalHandle = setInterval(processQueueOnce, POLL_INTERVAL_MS);
};

exports.stop = () => {
  if (intervalHandle) clearInterval(intervalHandle);
  intervalHandle = null;
};

exports.processQueueOnce = processQueueOnce;