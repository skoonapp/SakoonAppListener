import React from 'react';
import PolicyPageLayout from '../../components/common/PolicyPageLayout';

export const TermsContent: React.FC = () => {
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <>
            <p className="text-sm"><em>Last Updated: {today}</em></p>
            
            <div className="p-4 rounded-lg bg-cyan-50 dark:bg-slate-800 border border-cyan-200 dark:border-cyan-700/50 my-6">
                <h3 className="text-lg font-bold text-cyan-800 dark:text-cyan-300">सबसे ज़रूरी बातें (Key Points)</h3>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-cyan-700 dark:text-cyan-300/90">
                    <li><strong className="text-green-600 dark:text-green-400">हमेशा करें:</strong> User की इज़्ज़त करें, अच्छे से बात करें, और नियमों का पालन करें।</li>
                    <li><strong className="text-red-500 dark:text-red-400">कभी न करें:</strong> अपनी पर्सनल जानकारी (नंबर, सोशल मीडिया) शेयर न करें, गलत भाषा का इस्तेमाल न करें, और कॉल/चैट बीच में न काटें।</li>
                    <li><strong className="text-yellow-600 dark:text-yellow-400">पेमेंट याद रखें:</strong> पेमेंट हर हफ़्ते सोमवार को होता है। Minimum Payout ₹699 है। नियम तोड़ने पर आपकी कमाई 'Hold' हो सकती है और 20% पेनल्टी लग सकती है।</li>
                </ul>
            </div>

            <h2>1. यह किसके लिए है? (Introduction)</h2>
            <p>SakoonApp में आपका स्वागत है। ये नियम बताते हैं कि आप, एक Listener के तौर पर, हमारे प्लेटफॉर्म का इस्तेमाल कैसे कर सकते हैं। ऐप इस्तेमाल करने का मतलब है कि आप इन सभी नियमों से सहमत हैं।</p>

            <h2>2. Listener बनने की शर्तें (Eligibility)</h2>
            <ul>
                <li>आपकी उम्र कम से कम 18 साल होनी चाहिए।</li>
                <li>आपको हमारी वेरिफिकेशन प्रक्रिया पूरी करनी होगी।</li>
                <li>आपको हमारे सभी दिशानिर्देशों का पालन करना होगा।</li>
            </ul>

            <h2>3. Listener के लिए नियम (Listener Guidelines)</h2>
            <h3>आपका व्यवहार:</h3>
            <ul>
                <li>हमेशा पेशेवर और सम्मानजनक तरीके से बात करें।</li>
                <li>बिना किसी ठोस कारण के कॉल या चैट को बीच में न काटें।</li>
                <li>User की प्राइवेसी का ध्यान रखें, उनकी बातें गुप्त रखें।</li>
                <li>गाली-गलौज, गलत भाषा या यौन संबंधी बातें करना सख्त मना है।</li>
                 <li><strong className="text-red-600 dark:text-red-400">अपनी कोई भी पर्सनल जानकारी जैसे मोबाइल नंबर, पता, या सोशल मीडिया अकाउंट (Instagram, Facebook, etc.) शेयर करना सख्त मना है।</strong></li>
            </ul>
            <p className="font-semibold text-red-600 dark:text-red-400">ध्यान दें: आपकी सभी गतिविधियाँ एडमिन द्वारा मॉनिटर की जाती हैं ताकि सुरक्षा बनी रहे।</p>


            <h2>4. कमाई और पेमेंट (Earnings & Payments)</h2>
            <p>आपकी कमाई आपके काम और प्रदर्शन पर आधारित है। जितना अच्छा आप Users के साथ जुड़ेंगे, उतनी ही ज़्यादा आपकी कमाई होगी।</p>
            
            <h3>पेमेंट का शेड्यूल:</h3>
            <ul className="list-decimal pl-5 space-y-2">
                <li>
                    <strong>सामान्य पेमेंट (Normal Payment):</strong>
                    <ul>
                        <li><strong>कब मिलेगा:</strong> हर हफ़्ते सोमवार (Monday) को।</li>
                        <li><strong>Minimum Payout:</strong> पेमेंट के लिए कम से कम ₹699 होने चाहिए।</li>
                        <li><strong>कितना कटेगा:</strong> हर पेमेंट पर ₹10 की बैंक ट्रांजैक्शन फीस लगेगी।</li>
                        <li><strong>कैसे मिलेगा:</strong> आपके दिए गए बैंक खाते या UPI में।</li>
                    </ul>
                </li>
                <li>
                    <strong>होल्ड अकाउंट (Hold Account):</strong>
                    <ul>
                         <li><strong>यह क्या है:</strong> अगर आप कोई नियम तोड़ते हैं (जैसे पर्सनल जानकारी देना), तो आपकी कमाई 'Hold' पर चली जाती है।</li>
                        <li><strong>कब मिलेगा:</strong> होल्ड की गई कमाई का पेमेंट भी हर हफ़्ते सोमवार को होगा।</li>
                        <li><strong>कितना कटेगा:</strong> होल्ड की गई कमाई से <strong>20% पेनल्टी</strong> और ₹10 ट्रांजैक्शन फीस काटी जाएगी।</li>
                    </ul>
                </li>
            </ul>
            

            <h2>5. नियम तोड़ने के परिणाम (Consequences of Violation)</h2>
            <ul>
                <li><strong>छोटी गलतियाँ:</strong> चेतावनी या आपकी कमाई को अस्थायी रूप से रोका जा सकता है।</li>
                <li><strong>पर्सनल जानकारी शेयर करना:</strong> आपका अकाउंट तुरंत सस्पेंड कर दिया जाएगा और कमाई होल्ड पर चली जाएगी।</li>
                <li><strong>बड़ी गलतियाँ:</strong> आपका अकाउंट हमेशा के लिए बंद किया जा सकता है।</li>
            </ul>

            <h2>6. हमारी ज़िम्मेदारी (Disclaimer)</h2>
            <p>SakoonApp एक प्रोफेशनल मानसिक स्वास्थ्य सेवा नहीं है। हमारे Listeners प्रशिक्षित काउंसलर या थेरेपिस्ट नहीं हैं। आपातकालीन स्थिति में, कृपया किसी प्रोफेशनल से संपर्क करें।</p>

            <h2>7. नियमों में बदलाव (Changes to Terms)</h2>
            <p>हम इन नियमों को कभी भी बदल सकते हैं। बड़े बदलावों के बारे में आपको सूचित किया जाएगा।</p>

            <h2>8. हमसे संपर्क करें (Contact Us)</h2>
            <p>अगर आपका कोई सवाल है, तो हमें यहाँ ईमेल करें: <a href="mailto:sakoonapp.help@gmail.com">sakoonapp.help@gmail.com</a></p>

            <hr/>
            <blockquote className="border-l-4 border-cyan-500 pl-4 italic">
              “Users का सम्मान करें, नियमों का पालन करें और सुरक्षित रूप से अपनी आय बढ़ाएँ।”
            </blockquote>
        </>
    );
};

const TermsScreen: React.FC = () => {
    return (
        <PolicyPageLayout title="Terms & Conditions">
            <TermsContent />
        </PolicyPageLayout>
    );
};
export default TermsScreen;