const axios = require('axios');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { apiKey, listId, serverPrefix } = require('../config/mailchimp');

exports.addOrUpdateSubscriber = async (req, res) => {
    const email = req.body.Email;

    if (!email) {
        return res.status(400).json({ message: 'E-posta adresi gerekli.' });
    }

    const emailHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');

    try {
        const getResponse = await axios.get(`https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members/${emailHash}`, {
            headers: {
                'Authorization': `apikey ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        if (getResponse.status === 200) {
            const patchResponse = await axios.patch(`https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members/${emailHash}`, {
                status: 'subscribed',
            }, {
                headers: {
                    'Authorization': `apikey ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            });

            if (patchResponse.status === 200) {
                sendWelcomeEmail(email);
                return res.status(200).json({ message: 'Abonelik durumu güncellendi ve e-posta gönderildi.' });
            } else {
                return res.status(patchResponse.status).json({ message: 'Durum güncellenirken bir hata oluştu.' });
            }
        }
    } catch (error) {
        if (error.response && error.response.status === 404) {
            try {
                const postResponse = await axios.post(`https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members/`, {
                    email_address: email,
                    status: 'subscribed',
                }, {
                    headers: {
                        'Authorization': `apikey ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (postResponse.status === 200) {
                    sendWelcomeEmail(email);
                    return res.status(200).json({ message: 'Yeni abonelik başarılı ve e-posta gönderildi.' });
                } else {
                    return res.status(postResponse.status).json({ message: 'Bir hata oluştu.' });
                }
            } catch (postError) {
                console.error('Hata (Yeni abone ekleme): ', postError);
                return res.status(500).json({ message: 'Bir hata oluştu.' });
            }
        } else {
            console.error('Hata (Abone kontrolü): ', error);
            return res.status(500).json({ message: 'Bir hata oluştu.' });
        }
    }
};

exports.unsubscribe = async (req, res) => {
    const email = req.params.email;

    try {
        const emailHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
        const response = await axios.delete(`https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members/${emailHash}`, {
            headers: {
                'Authorization': `apikey ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.status === 204) {
            res.send('Abonelikten başarıyla çıkıldı.');
        } else {
            res.status(response.status).send('Bir hata oluştu.');
        }
    } catch (error) {
        console.error('Hata: ', error);
        res.status(500).send('Bir hata oluştu.');
    }
};

const sendWelcomeEmail = (email) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'your-email@gmail.com',
            pass: 'your-email-password'
        }
    });

    let mailOptions = {
        from: 'your-email@gmail.com',
        to: email,
        subject: 'Aboneliğiniz Başarıyla Tamamlandı!',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <div style="text-align: center;">
                <img src="http://example.com/_assets/images/logo.png" alt="Logo" style="max-width: 150px; margin-bottom: 20px;">
            </div>
            <h2 style="color: #333; text-align: center;">Hoş Geldiniz!</h2>
            <p style="color: #555; text-align: center;">Merhaba,</p>
            <p style="color: #555; text-align: center;">E-bültenimize abone olduğunuz için teşekkür ederiz. Sizleri en son haberler, güncellemeler ve özel teklifler hakkında bilgilendireceğiz.</p>
            <div style="text-align: center; margin-top: 20px;">
                <a href="https://example.com" style="text-decoration: none; color: white; background-color: #007bff; padding: 10px 20px; border-radius: 5px;">Web Sitemizi Ziyaret Edin</a>
            </div>
            <p style="color: #777; text-align: center; margin-top: 20px;">E-bültenimizden çıkmak isterseniz, <a href="https://example.com/unsubscribe?email=${email}" style="color: #007bff; text-decoration: none;">abonelikten çıkabilirsiniz</a>.</p>
        </div>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('E-posta gönderilirken hata oluştu:', error);
        } else {
            console.log('E-posta başarıyla gönderildi:', info.response);
        }
    });
};
