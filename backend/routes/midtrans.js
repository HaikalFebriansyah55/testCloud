const express = require('express');
const router = express.Router();
const midtransClient = require('midtrans-client');

// Ganti dengan serverKey dan clientKey sandbox dari dashboard Midtrans
const MIDTRANS_SERVER_KEY = 'SB-Mid-server-5hwpeZcnsrLDBPK1izRKRXsS';
const MIDTRANS_CLIENT_KEY = 'SB-Mid-client-GtaB7TFGUCSStLJM';

router.post('/snap', async (req, res) => {
    const { order_id, gross_amount, customer_name, customer_email } = req.body;

    if (!order_id || !gross_amount || !customer_name) {
        return res.status(400).json({ message: 'Data tidak lengkap' });
    }

    // Validasi email sederhana
    function isValidEmail(email) {
        return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    const emailToSend = isValidEmail(customer_email) ? customer_email : 'default@email.com';

    let snap = new midtransClient.Snap({
        isProduction: false,
        serverKey: MIDTRANS_SERVER_KEY,
        clientKey: MIDTRANS_CLIENT_KEY
    });

    let parameter = {
        transaction_details: {
            order_id: order_id,
            gross_amount: Number(gross_amount)
        },
        customer_details: {
            first_name: customer_name,
            email: emailToSend
        }
    };

    try {
        const transaction = await snap.createTransaction(parameter);
        res.json({ snapToken: transaction.token });
    } catch (err) {
        res.status(500).json({ message: 'Gagal membuat Snap Token', error: err.message });
    }
});

module.exports = router;