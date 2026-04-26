from collections import deque
import time

class FatigueDebouncer:
    """
    نظام مكافحة الإنذارات الكاذبة والحساسية المفرطة
    """
    
    def __init__(self, threshold=75.0, required_frames=8, cooldown=8):
        # threshold: نسبة الثقة المطلوبة (%)
        # required_frames: عدد الإطارات المتتالية المطلوبة
        # cooldown: ثواني بين الإنذارات
        self.threshold = threshold
        self.required_frames = required_frames
        self.cooldown = cooldown
        self.history = deque(maxlen=required_frames)
        self.last_alert = 0
        self.consecutive_fatigue = 0
    
    def process(self, prediction, confidence):
        """
        معالجة توقع جديد
        prediction: 'active' ou 'fatigue'
        confidence: 0-100
        """
        # التحقق من الثقة
        if confidence < self.threshold:
            # الثقة منخفضة، لا نعتبر هذا توقعاً موثوقاً
            is_fatigued = False
        else:
            is_fatigued = (prediction == 'fatigue')
        
        # إضافة إلى التاريخ
        self.history.append(is_fatigued)
        
        # ليس لدينا ما يكفي من الإطارات بعد
        if len(self.history) < self.required_frames:
            return False, self.get_status()
        
        # حساب نسبة التعب في الإطارات الأخيرة
        fatigue_ratio = sum(self.history) / self.required_frames
        
        # التحقق من شروط الإنذار (60% على الأقل من الإطارات مصنفة كتعب)
        should_alert = False
        if fatigue_ratio >= 0.6:  # 60% من الإطارات متعبة
            now = time.time()
            if now - self.last_alert > self.cooldown:
                self.last_alert = now
                should_alert = True
                print(f"🚨 ALERTE! Fatigue ratio: {fatigue_ratio:.2f}")
        
        return should_alert, self.get_status()
    
    def get_status(self):
        """الحالة الحالية"""
        if len(self.history) == 0:
            return "active"
        ratio = sum(self.history) / len(self.history)
        return "fatigue" if ratio >= 0.5 else "active"
    
    def reset(self):
        """إعادة تعيين"""
        self.history.clear()
        self.consecutive_fatigue = 0