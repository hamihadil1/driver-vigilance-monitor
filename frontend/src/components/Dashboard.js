const checkFatigue = (prediction, confidence) => {
    if (prediction === 'fatigue') {
        // 1. إشعار
        if (Notification.permission === 'granted') {
            new Notification('⚠️ ALERTE FATIGUE ⚠️', {
                body: `Confiance: ${confidence}% - ARRETEZ-VOUS!`,
                vibrate: [200, 100, 200]
            });
        }
        
        // 2. صوت
        new Audio('/alert.mp3').play();
        
        // 3. خلفية حمراء
        document.body.style.animation = 'blink 0.5s infinite';
        
        // 4. رسالة تحذير
        alert('⚠️ CONDUCTEUR FATIGUE! Veuillez vous arrêter.');
    }
};

// CSS للوميض
const style = document.createElement('style');
style.textContent = `
    @keyframes blink {
        0% { background-color: white; }
        50% { background-color: red; }
        100% { background-color: white; }
    }
`;
document.head.appendChild(style);