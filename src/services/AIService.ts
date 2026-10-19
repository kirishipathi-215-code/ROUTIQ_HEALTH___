// Abstract AI Service

export interface AIResponse {
  language?: string;
  intent: string;
  healthcare_need?: string | null;
  service_category?: string | null;
  urgency?: string | null;
  incident_type?: string | null;
  consciousness?: string | null;
  bleeding?: string | null;
  breathing?: string | null;
  injury_information?: string | null;

  is_healthcare_related: boolean;
  confidence: number;
  requires_clarification: boolean;
  requires_confirmation: boolean;

  response_text: string;
  response_language: string;
  data?: any;
}

export interface HealthHistoryExtraction {
  field: 'existingConditions' | 'allergies' | 'medications' | 'previousSurgeries' | 'general';
  detectedItems: string[];
  spokenConfirmationPrompt: string;
  rawText: string;
  language: string;
}

export abstract class AIService {
  abstract processInput(text: string, mode: 'NORMAL' | 'EMERGENCY' | 'LANGUAGE_SELECT' | 'JOURNEY'): Promise<AIResponse>;
}

export class MockAIService extends AIService {
  async processInput(text: string, mode: 'NORMAL' | 'EMERGENCY' | 'LANGUAGE_SELECT' | 'JOURNEY'): Promise<AIResponse> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const trimmed = text.trim();
    const lowerText = trimmed.toLowerCase();

    // Detect language
    let detectedLang = 'en';
    if (/[\u0900-\u097F]/.test(text)) {
      // Devanagari script - distinguish Hindi vs Marathi
      if (
        lowerText.includes('मराठी') || lowerText.includes('मला') || lowerText.includes('आहे') ||
        lowerText.includes('ताप') || lowerText.includes('डोकेदुखी') || lowerText.includes('अपघात') ||
        lowerText.includes('बेशुद्ध') || lowerText.includes('औषध') || lowerText.includes('रुग्णालय')
      ) {
        detectedLang = 'mr';
      } else {
        detectedLang = 'hi';
      }
    } else if (
      /[\u0B80-\u0BFF]/.test(text) ||
      lowerText.includes('enakku') || lowerText.includes('irukku') || lowerText.includes('venum') ||
      lowerText.includes('sariyaa') || lowerText.includes('kaichal') || lowerText.includes('thalaivali') ||
      lowerText.includes('maruthuvamanai')
    ) {
      detectedLang = 'ta';
    } else if (lowerText.includes('marathi')) {
      detectedLang = 'mr';
    } else if (lowerText.includes('hindi')) {
      detectedLang = 'hi';
    } else if (lowerText.includes('tamil')) {
      detectedLang = 'ta';
    }

    // 1. LANGUAGE SELECT MODE
    if (mode === 'LANGUAGE_SELECT') {
      let lang = 'en';
      if (lowerText.includes('marathi') || lowerText.includes('मराठी')) lang = 'mr';
      else if (lowerText.includes('hindi') || lowerText.includes('हिंदी')) lang = 'hi';
      else if (lowerText.includes('tamil') || lowerText.includes('தமிழ்')) lang = 'ta';
      
      return {
        language: lang,
        intent: 'set_language',
        is_healthcare_related: false,
        confidence: 0.95,
        requires_clarification: false,
        requires_confirmation: false,
        response_text: `Language set to ${lang}`,
        response_language: lang
      };
    }

    // 2. JOURNEY MODE (Post-consultation instructions)
    if (mode === 'JOURNEY') {
      const isIrrelevantInJourney = this.isIrrelevant(lowerText);
      if (
        isIrrelevantInJourney &&
        !lowerText.includes('blood') && !lowerText.includes('test') &&
        !lowerText.includes('medicine') && !lowerText.includes('tablet') &&
        !lowerText.includes('x-ray') && !lowerText.includes('scan')
      ) {
        return {
          intent: 'irrelevant_input',
          is_healthcare_related: false,
          confidence: 0.9,
          requires_clarification: true,
          requires_confirmation: false,
          response_text: this.getLocalizedClarification(detectedLang, 'Please share the doctor\'s medical advice, prescribed tests, or medicines.'),
          response_language: detectedLang
        };
      }

      const steps = [];
      if (
        lowerText.includes('blood') || lowerText.includes('test') || lowerText.includes('रक्त') ||
        lowerText.includes('खून') || lowerText.includes('pathology') || lowerText.includes('lab') ||
        lowerText.includes('ரத்த பரிசோதனை')
      ) {
        steps.push({ title: 'Lab Test', desc: 'Visit Pathology Lab on 1st Floor for blood test.' });
      }
      if (
        lowerText.includes('x-ray') || lowerText.includes('xray') || lowerText.includes('एक्स-रे') ||
        lowerText.includes('scan') || lowerText.includes('mri') || lowerText.includes('ct')
      ) {
        steps.push({ title: 'Radiology / Imaging', desc: 'Visit Radiology Dept on Ground Floor for imaging.' });
      }
      if (
        lowerText.includes('medicine') || lowerText.includes('pharmacy') || lowerText.includes('औषध') ||
        lowerText.includes('दवा') || lowerText.includes('pills') || lowerText.includes('tablet') ||
        lowerText.includes('syrup') || lowerText.includes('marunthu') || lowerText.includes('மருந்து')
      ) {
        steps.push({ title: 'Pharmacy', desc: 'Collect prescribed medicines from Main Pharmacy.' });
      }
      if (
        lowerText.includes('admit') || lowerText.includes('ward') || lowerText.includes('ipd') ||
        lowerText.includes('bed') || lowerText.includes('भरती') || lowerText.includes('சேர்க்கை')
      ) {
        steps.push({ title: 'Admission', desc: 'Proceed to IPD admission desk on ground floor.' });
      }
      if (
        lowerText.includes('surgery') || lowerText.includes('operation') ||
        lowerText.includes('शस्त्रक्रिया') || lowerText.includes('அறுவை சிகிச்சை')
      ) {
        steps.push({ title: 'Surgical Prep', desc: 'Consult the surgical coordinator in room 204.' });
      }
      if (steps.length === 0) {
        steps.push({ title: 'Follow Doctor Instructions', desc: `Follow instruction: "${trimmed}"` });
      }

      return {
        intent: 'journey_steps',
        is_healthcare_related: true,
        confidence: 0.92,
        requires_clarification: false,
        requires_confirmation: false,
        response_text: 'Doctor instructions processed successfully.',
        response_language: detectedLang,
        data: steps
      };
    }

    // 3. CHECK IRRELEVANT INPUT (Applies to both NORMAL and EMERGENCY)
    const isIrrelevantQuery = this.isIrrelevant(lowerText);

    // 4. EMERGENCY MODE
    if (mode === 'EMERGENCY') {
      const emergencyKeywords = [
        'emergency', 'accident', 'unconscious', 'bleeding', 'blood', 'chest pain',
        'heart', 'choking', 'breath', 'crash', 'faint', 'fracture', 'head injury',
        'stroke', 'attack', 'burn', 'अपघात', 'बेशुद्ध', 'रक्त', 'श्वास', 'बेहोश',
        'खून', 'दुर्घटना', 'விபத்து', 'மயக்கம்', 'ரத்தம்', 'நெஞ்சு வலி'
      ];
      const hasEmergencyKeyword = emergencyKeywords.some(k => lowerText.includes(k));

      if (isIrrelevantQuery || !hasEmergencyKeyword) {
        const clarificationText = this.getEmergencyClarification(detectedLang);
        this.logDevState(text, false, 0.92, null, false);
        return {
          intent: 'irrelevant_emergency',
          is_healthcare_related: false,
          confidence: 0.92,
          requires_clarification: true,
          requires_confirmation: false,
          response_text: clarificationText,
          response_language: detectedLang
        };
      }

      // Genuine Emergency Detected
      let consciousness: string = 'UNKNOWN';
      if (
        lowerText.includes('unconscious') || lowerText.includes('बेशुद्ध') ||
        lowerText.includes('faint') || lowerText.includes('बेहोश') ||
        lowerText.includes('மயக்கம்') || lowerText.includes('passed out')
      ) {
        consciousness = 'unconscious';
      } else if (
        lowerText.includes('conscious') || lowerText.includes('alert') ||
        lowerText.includes('awake') || lowerText.includes('शुद्धीत') ||
        lowerText.includes('விழிப்புடன்')
      ) {
        consciousness = 'alert';
      }

      let bleeding: string = 'UNKNOWN';
      if (
        lowerText.includes('severe bleeding') || lowerText.includes('heavy bleeding') ||
        lowerText.includes('lots of blood') || lowerText.includes('रक्तस्राव') ||
        lowerText.includes('ரத்தப்போக்கு')
      ) {
        bleeding = 'severe';
      } else if (
        lowerText.includes('bleeding') || lowerText.includes('blood') ||
        lowerText.includes('रक्त') || lowerText.includes('खून') || lowerText.includes('ரத்தம்')
      ) {
        bleeding = 'moderate';
      } else if (
        lowerText.includes('no bleeding') || lowerText.includes('no blood') ||
        lowerText.includes('रक्त नाही') || lowerText.includes('ரத்தம் இல்லை')
      ) {
        bleeding = 'none';
      }

      let breathing: string = 'UNKNOWN';
      if (
        lowerText.includes('breath') || lowerText.includes('श्वास') ||
        lowerText.includes('choking') || lowerText.includes('suffocating') ||
        lowerText.includes('மூச்சு')
      ) {
        if (lowerText.includes('normal breathing') || lowerText.includes('breathing fine') || lowerText.includes('மூச்சு விடுகிறார்')) {
          breathing = 'normal';
        } else {
          breathing = 'difficult';
        }
      }

      let incident = 'medical_emergency';
      if (
        lowerText.includes('accident') || lowerText.includes('अपघात') ||
        lowerText.includes('दुर्घटना') || lowerText.includes('crash') ||
        lowerText.includes('hit') || lowerText.includes('collision') ||
        lowerText.includes('விபத்து')
      ) {
        incident = 'accident';
      } else if (
        lowerText.includes('chest pain') || lowerText.includes('heart attack') ||
        lowerText.includes('cardiac') || lowerText.includes('நெஞ்சு வலி')
      ) {
        incident = 'cardiac_emergency';
      }

      const urgency = (consciousness === 'unconscious' || breathing === 'difficult' || bleeding === 'severe') ? 'critical' : 'high';
      
      let confirmQuestion = '';
      if (consciousness === 'UNKNOWN' || breathing === 'UNKNOWN') {
        confirmQuestion = this.getEmergencyUnknownPrompt(detectedLang, incident);
      } else {
        confirmQuestion = this.getEmergencyConfirmPrompt(detectedLang, incident, consciousness);
      }

      this.logDevState(text, true, 0.95, incident, true);

      return {
        intent: 'emergency',
        incident_type: incident,
        consciousness,
        bleeding,
        breathing,
        injury_information: trimmed,
        urgency,
        is_healthcare_related: true,
        confidence: 0.95,
        requires_clarification: false,
        requires_confirmation: true,
        response_text: confirmQuestion,
        response_language: detectedLang
      };
    }

    // 5. NORMAL MODE
    // Check if input is non-healthcare / small talk / greeting
    if (isIrrelevantQuery) {
      const clarificationText = this.getGeneralClarification(detectedLang);
      this.logDevState(text, false, 0.95, null, false);
      return {
        intent: 'irrelevant_input',
        healthcare_need: null,
        service_category: null,
        urgency: null,
        is_healthcare_related: false,
        confidence: 0.95,
        requires_clarification: true,
        requires_confirmation: false,
        response_text: clarificationText,
        response_language: detectedLang
      };
    }

    // Check for specific healthcare intents and symptoms
    const healthcareSignals = this.extractHealthcareNeed(lowerText, detectedLang);

    if (!healthcareSignals.matched) {
      // No clear healthcare symptom or request found
      const clarificationText = this.getGeneralClarification(detectedLang);
      this.logDevState(text, false, 0.88, null, false);
      return {
        intent: 'insufficient_healthcare_info',
        healthcare_need: null,
        service_category: null,
        urgency: null,
        is_healthcare_related: false,
        confidence: 0.88,
        requires_clarification: true,
        requires_confirmation: false,
        response_text: clarificationText,
        response_language: detectedLang
      };
    }

    // Healthcare need is valid - pure localized prompt
    const confirmPrompt = this.getNormalConfirmPrompt(detectedLang, healthcareSignals.displayNeed, healthcareSignals.displayCategory);

    this.logDevState(text, true, 0.92, healthcareSignals.need, true);

    return {
      intent: 'healthcare_navigation',
      healthcare_need: healthcareSignals.need,
      service_category: healthcareSignals.category,
      urgency: healthcareSignals.urgency,
      is_healthcare_related: true,
      confidence: 0.92,
      requires_clarification: false,
      requires_confirmation: true,
      response_text: confirmPrompt,
      response_language: detectedLang
    };
  }

  /**
   * Health History Voice Extraction Helper
   * Parses spoken health history and generates natural confirmation prompt before saving
   */
  processHealthHistoryVoice(text: string, lang: string = 'en'): HealthHistoryExtraction {
    const lower = text.toLowerCase();
    let field: HealthHistoryExtraction['field'] = 'general';
    const detectedItems: string[] = [];

    // Allergies
    if (lower.includes('allerg') || lower.includes('एलर्जी') || lower.includes('अॅलर्जी') || lower.includes('ஒவ்வாமை') || lower.includes('reaction')) {
      field = 'allergies';
      if (lower.includes('penicillin') || lower.includes('पेनिसिलिन')) detectedItems.push('Penicillin');
      if (lower.includes('sulfa')) detectedItems.push('Sulfa drugs');
      if (lower.includes('peanut') || lower.includes('शेंगदाणा') || lower.includes('வேர்க்கடலை')) detectedItems.push('Peanuts');
      if (lower.includes('dust') || lower.includes('धूल') || lower.includes('धूळ') || lower.includes('தூசி')) detectedItems.push('Dust');
      if (detectedItems.length === 0) detectedItems.push(text.trim());
    }
    // Medications
    else if (lower.includes('medicin') || lower.includes('tablet') || lower.includes('दवा') || lower.includes('औषध') || lower.includes('மருந்து') || lower.includes('insulin') || lower.includes('metformin')) {
      field = 'medications';
      if (lower.includes('metformin')) detectedItems.push('Metformin (500mg)');
      if (lower.includes('insulin') || lower.includes('इंसुलिन')) detectedItems.push('Insulin');
      if (lower.includes('bp') || lower.includes('amlodipine')) detectedItems.push('Amlodipine (5mg)');
      if (detectedItems.length === 0) detectedItems.push(text.trim());
    }
    // Surgeries
    else if (lower.includes('surger') || lower.includes('operation') || lower.includes('सर्जरी') || lower.includes('शस्त्रक्रिया') || lower.includes('அறுவை')) {
      field = 'previousSurgeries';
      if (lower.includes('appendix') || lower.includes('appendectomy')) detectedItems.push('Appendectomy');
      if (lower.includes('cesarean') || lower.includes('c-section')) detectedItems.push('Cesarean Section');
      if (lower.includes('knee') || lower.includes('गुडघा') || lower.includes('घुटने') || lower.includes('மூட்டு')) detectedItems.push('Knee Replacement');
      if (detectedItems.length === 0) detectedItems.push(text.trim());
    }
    // Existing Conditions (Default)
    else {
      field = 'existingConditions';
      if (lower.includes('diabet') || lower.includes('sugar') || lower.includes('मधुमेह') || lower.includes('சர்க்கரை') || lower.includes('நீரிழிவு')) detectedItems.push('Type 2 Diabetes');
      if (lower.includes('bp') || lower.includes('blood pressure') || lower.includes('hypertension') || lower.includes('रक्तदाब') || lower.includes('இரத்த அழுத்தம்')) detectedItems.push('Hypertension');
      if (lower.includes('asthma') || lower.includes('दमा') || lower.includes('ஆஸ்துமா')) detectedItems.push('Asthma');
      if (lower.includes('thyroid') || lower.includes('थायरॉइड')) detectedItems.push('Hypothyroidism');
      if (detectedItems.length === 0) detectedItems.push(text.trim());
    }

    const itemsSummary = detectedItems.join(', ');
    let spokenConfirmationPrompt = '';

    switch (lang) {
      case 'ta':
        spokenConfirmationPrompt = `நீங்கள் "${itemsSummary}" என்று கூறியுள்ளீர்கள். இதனை உங்கள் மருத்துவ வரலாற்றில் சேர்க்கலாமா?`;
        break;
      case 'hi':
        spokenConfirmationPrompt = `आपने बताया कि "${itemsSummary}"। क्या इसे आपके चिकित्सा इतिहास में सुरक्षित किया जाए?`;
        break;
      case 'mr':
        spokenConfirmationPrompt = `तुम्ही सांगितले की "${itemsSummary}"। हे तुमच्या वैद्यकीय इतिहासात जतन करायचे का?`;
        break;
      default:
        spokenConfirmationPrompt = `You mentioned "${itemsSummary}". Would you like to save this to your medical history?`;
        break;
    }

    return {
      field,
      detectedItems,
      spokenConfirmationPrompt,
      rawText: text.trim(),
      language: lang
    };
  }

  private isIrrelevant(text: string): boolean {
    const trimmed = text.trim().toLowerCase();
    
    // Exact short greetings and chit-chat
    const exactIrrelevant = [
      'hi', 'hello', 'hey', 'good morning', 'good evening', 'good afternoon',
      'how are you', 'how are you?', 'who are you', 'tell me a joke', 'joke',
      'what is the weather', 'weather', 'weather today', 'cricket', 'i like cricket',
      'my name is rahul', 'rahul', 'what is your name', 'bye', 'goodbye', 'thanks', 'thank you',
      'namaste', 'namaskara', 'vanakkam', 'kasa ahes', 'kasa kay', 'வணக்கம்', 'नमस्ते', 'नमस्कार'
    ];
    if (exactIrrelevant.includes(trimmed)) return true;

    // Pattern-based irrelevant checks
    if (
      /^(hi|hello|hey|good morning|good evening|namaste|vanakkam)\b/i.test(trimmed) && 
      !/(fever|pain|doctor|hospital|headache|bleed|accident|emergency|sick|tablet|cough|cold|kidney|heart|stomach|wound|medic|काइसल|தலைவலி|காய்ச்சல்|ताप|दुखणे)/i.test(trimmed)
    ) {
      return true;
    }

    if (/^(tell me a joke|what is the weather|who are you|how are you|i like cricket|my name is)/i.test(trimmed)) {
      return true;
    }

    // Very short non-informative phrases without any health term
    if (trimmed.length <= 4 && !/(pain|sick|ill|flu|hurt|ache|care|fever|cold)/i.test(trimmed)) {
      return true;
    }

    return false;
  }

  private extractHealthcareNeed(
    text: string,
    lang: string
  ): { matched: boolean; need: string; category: string; urgency: string; displayNeed: string; displayCategory: string } {
    const lower = text.toLowerCase();

    // Mapping helper for pure language-specific labels
    const getLabels = (
      enNeed: string, enCat: string,
      hiNeed: string, hiCat: string,
      mrNeed: string, mrCat: string,
      taNeed: string, taCat: string
    ) => {
      switch (lang) {
        case 'hi': return { need: hiNeed, category: hiCat };
        case 'mr': return { need: mrNeed, category: mrCat };
        case 'ta': return { need: taNeed, category: taCat };
        default: return { need: enNeed, category: enCat };
      }
    };

    // Check emergency crossover
    if (
      lower.includes('accident') || lower.includes('अपघात') || lower.includes('दुर्घटना') ||
      lower.includes('unconscious') || lower.includes('बेशुद्ध') || lower.includes('heavy bleeding') ||
      lower.includes('விபத்து') || lower.includes('மயக்கம்')
    ) {
      const labels = getLabels(
        'Emergency Situation', 'Emergency Care',
        'आपातकालीन स्थिति', 'आपातकालीन देखभाल',
        'आणीबाणीची परिस्थिती', 'तातडीची वैद्यकीय सेवा',
        'அவசர மருத்துவ நிலை', 'அவசர சிகிச்சை மையம்'
      );
      return {
        matched: true,
        need: 'emergency_evaluation',
        category: 'emergency',
        urgency: 'critical',
        displayNeed: labels.need,
        displayCategory: labels.category
      };
    }

    // Headache and Fever combined
    if (
      (lower.includes('headache') || lower.includes('head pain') || lower.includes('डोकेदुखी') || lower.includes('सिरदर्द') || lower.includes('thalaivali') || lower.includes('தலைவலி')) &&
      (lower.includes('fever') || lower.includes('ताप') || lower.includes('बुखार') || lower.includes('temperature') || lower.includes('kaichal') || lower.includes('காய்ச்சல்'))
    ) {
      const labels = getLabels(
        'Headache and Fever', 'General Medical Consultation',
        'सिरदर्द और बुखार', 'सामान्य चिकित्सक परामर्श',
        'डोकेदुखी आणि ताप', 'सामान्य वैद्यकीय सल्ला',
        'காய்ச்சல் மற்றும் தலைவலி', 'பொது மருத்துவர் ஆலோசனை'
      );
      return {
        matched: true,
        need: 'headache_and_fever',
        category: 'primary_care',
        urgency: 'non_emergency',
        displayNeed: labels.need,
        displayCategory: labels.category
      };
    }

    // Fever alone
    if (
      lower.includes('fever') || lower.includes('ताप') || lower.includes('बुखार') ||
      lower.includes('high temperature') || lower.includes('kaichal') || lower.includes('juram') ||
      lower.includes('காய்ச்சல்')
    ) {
      const labels = getLabels(
        'Fever', 'General Medical Consultation',
        'बुखार', 'सामान्य चिकित्सक परामर्श',
        'ताप', 'सामान्य वैद्यकीय सल्ला',
        'காய்ச்சல்', 'பொது மருத்துவர் ஆலோசனை'
      );
      return {
        matched: true,
        need: 'fever',
        category: 'primary_care',
        urgency: 'non_emergency',
        displayNeed: labels.need,
        displayCategory: labels.category
      };
    }

    // Headache alone
    if (
      lower.includes('headache') || lower.includes('head pain') || lower.includes('डोकेदुखी') ||
      lower.includes('सिरदर्द') || lower.includes('thalaivali') || lower.includes('தலைவலி')
    ) {
      const labels = getLabels(
        'Headache', 'General Medical Consultation',
        'सिरदर्द', 'सामान्य चिकित्सक परामर्श',
        'डोकेदुखी', 'सामान्य वैद्यकीय सल्ला',
        'தலைவலி', 'பொது மருத்துவர் ஆலோசனை'
      );
      return {
        matched: true,
        need: 'headache',
        category: 'primary_care',
        urgency: 'non_emergency',
        displayNeed: labels.need,
        displayCategory: labels.category
      };
    }

    // Kidney / Renal
    if (
      lower.includes('kidney') || lower.includes('किडनी') || lower.includes('renal') ||
      lower.includes('dialysis') || lower.includes('मूतखडा') || lower.includes('siruneeragam') ||
      lower.includes('சிறுநீரகம்')
    ) {
      const labels = getLabels(
        'Kidney Care', 'Nephrology Specialist Consultation',
        'किडनी रोग देखभाल', 'नेफ्रोलॉजी विशेषज्ञ परामर्श',
        'मूत्रपिंड विकार', 'तज्ज्ञ डॉक्टरांचा सल्ला',
        'சிறுநீரக சிகிச்சை', 'சிறுநீரக சிறப்பு மருத்துவர் ஆலோசனை'
      );
      return {
        matched: true,
        need: 'kidney_follow_up',
        category: 'specialist_follow_up',
        urgency: 'non_emergency',
        displayNeed: labels.need,
        displayCategory: labels.category
      };
    }

    // Chest pain / Cardiac
    if (
      lower.includes('chest pain') || lower.includes('छातीत दुखणे') || lower.includes('सीने में दर्द') ||
      lower.includes('heart') || lower.includes('cardiac') || lower.includes('nenju vali') ||
      lower.includes('நெஞ்சு வலி')
    ) {
      const labels = getLabels(
        'Chest Pain / Heart Concern', 'Cardiology Specialist',
        'सीने में दर्द / हृदय समस्या', 'हृदय रोग विशेषज्ञ परामर्श',
        'छातीत दुखणे / हृदय विकार', 'हृदयविकार तज्ज्ञ सल्ला',
        'நெஞ்சு வலி / இதய நோய்', 'இதய சிறப்பு மருத்துவர் ஆலோசனை'
      );
      return {
        matched: true,
        need: 'cardiac_consultation',
        category: 'specialist_follow_up',
        urgency: 'high',
        displayNeed: labels.need,
        displayCategory: labels.category
      };
    }

    // Stomach pain / Gastro
    if (
      lower.includes('stomach') || lower.includes('abdomen') || lower.includes('पोटदुखी') ||
      lower.includes('पेट दर्द') || lower.includes('vomit') || lower.includes('उलटी') ||
      lower.includes('vayiru') || lower.includes('வயிறு')
    ) {
      const labels = getLabels(
        'Stomach Pain / Gastric Issue', 'Gastroenterology Consultation',
        'पेट दर्द / पाचन समस्या', 'पाचन रोग विशेषज्ञ परामर्श',
        'पोटदुखी / पोटाचे विकार', 'पोटविकार तज्ज्ञ सल्ला',
        'வயிற்று வலி / செரிமான கோளாறு', 'வயிற்றுப்பகுதி மருத்துவர் ஆலோசனை'
      );
      return {
        matched: true,
        need: 'gastro_consultation',
        category: 'primary_care',
        urgency: 'non_emergency',
        displayNeed: labels.need,
        displayCategory: labels.category
      };
    }

    // General Doctor / Physician request
    if (
      lower.includes('general doctor') || lower.includes('doctor') || lower.includes('physician') ||
      lower.includes('consultation') || lower.includes('checkup') || lower.includes('तपासणी') ||
      lower.includes('डॉक्टर') || lower.includes('மருத்துவர்')
    ) {
      const labels = getLabels(
        'General Health Checkup', 'Primary Care Physician',
        'सामान्य स्वास्थ्य जांच', 'प्राथमिक चिकित्सा परामर्श',
        'सर्वसाधारण आरोग्य तपासणी', 'प्राथमिक आरोग्य केंद्र / डॉक्टर',
        'பொது உடல் பரிசோதனை', 'பொது மருத்துவர் ஆலோசனை'
      );
      return {
        matched: true,
        need: 'general_consultation',
        category: 'primary_care',
        urgency: 'non_emergency',
        displayNeed: labels.need,
        displayCategory: labels.category
      };
    }

    // Cold / Cough / Respiratory
    if (
      lower.includes('cough') || lower.includes('cold') || lower.includes('khansi') ||
      lower.includes('sardi') || lower.includes('खोकला') || lower.includes('सर्दी') ||
      lower.includes('இருமல்') || lower.includes('சளி')
    ) {
      const labels = getLabels(
        'Cold and Cough', 'General Physician',
        'सर्दी और खांसी', 'सामान्य चिकित्सक परामर्श',
        'सर्दी आणि खोकला', 'सामान्य वैद्यकीय तपासणी',
        'சளி மற்றும் இருமல்', 'பொது மருத்துவர் ஆலோசனை'
      );
      return {
        matched: true,
        need: 'respiratory_care',
        category: 'primary_care',
        urgency: 'non_emergency',
        displayNeed: labels.need,
        displayCategory: labels.category
      };
    }

    // Bone / Orthopedic / Injury
    if (
      lower.includes('fracture') || lower.includes('bone') || lower.includes('joint pain') ||
      lower.includes('हाड') || lower.includes('हड्डी') || lower.includes('ortho') ||
      lower.includes('எலும்பு') || lower.includes('மூட்டு வலி')
    ) {
      const labels = getLabels(
        'Bone or Joint Concern', 'Orthopedic Specialist',
        'हड्डी या जोड़ों की समस्या', 'अस्थि रोग विशेषज्ञ',
        'हाडांचे किंवा सांधेदुखी', 'अस्थिरोग तज्ज्ञ',
        'எலும்பு அல்லது மூட்டு பிரச்சனை', 'எலும்பு முறிவு சிறப்பு மருத்துவர்'
      );
      return {
        matched: true,
        need: 'orthopedic_care',
        category: 'specialist_follow_up',
        urgency: 'non_emergency',
        displayNeed: labels.need,
        displayCategory: labels.category
      };
    }

    return { matched: false, need: '', category: '', urgency: '', displayNeed: '', displayCategory: '' };
  }

  private getGeneralClarification(lang: string): string {
    switch (lang) {
      case 'hi':
        return 'नमस्ते। मैं सही स्वास्थ्य सेवा खोजने में आपकी मदद कर सकता हूँ। कृपया बताएं कि आपको क्या स्वास्थ्य समस्या या सेवा चाहिए।';
      case 'mr':
        return 'नमस्कार. मी तुम्हाला योग्य आरोग्य सेवा शोधण्यात मदत करू शकतो. कृपया सांगा की तुम्हाला कोणती आरोग्य समस्या किंवा सेवा हवी आहे.';
      case 'ta':
        return 'வணக்கம். சரியான மருத்துவமனையை கண்டறிய நான் உதவ முடியும். உங்களுக்கு என்ன உடல்நலப் பிரச்சினை அல்லது சேவை தேவை என்று சொல்லுங்கள்.';
      default:
        return 'Hello. I can help you find the right healthcare facility. Please tell me what health problem or healthcare service you need.';
    }
  }

  private getEmergencyClarification(lang: string): string {
    switch (lang) {
      case 'hi':
        return 'मैं इस जानकारी से आपातकालीन स्थिति की पहचान नहीं कर सका। कृपया बताएं कि क्या हुआ, उदाहरण के लिए: दुर्घटना, बेहोश मरीज, गंभीर रक्तस्राव, सांस लेने में कठिनाई।';
      case 'mr':
        return 'मी या माहितीवरून आणीबाणीची परिस्थिती ओळखू शकलो नाही. कृपया काय झाले ते सांगा, उदाहरणार्थ: अपघात, बेशुद्ध रुग्ण, जास्त रक्तस्राव किंवा श्वास घेण्यास त्रास.';
      case 'ta':
        return 'அவசரநிலையை அடையாளம் காண முடியவில்லை. விபத்து, மயக்கம், ரத்தப்போக்கு, மூச்சுத்திணறல் போன்ற நிலைமையை விவரிக்கவும்.';
      default:
        return 'I couldn\'t identify an emergency situation from that information. Please describe what happened, for example: accident, unconscious patient, severe bleeding, breathing difficulty, or another emergency.';
    }
  }

  private getNormalConfirmPrompt(lang: string, need: string, category: string): string {
    switch (lang) {
      case 'hi':
        return `मैंने समझा कि आपको ${need} है और ${category} की आवश्यकता है। क्या यह सही है?`;
      case 'mr':
        return `मला समजले की तुम्हाला ${need} ची समस्या आहे आणि ${category} ची गरज आहे. हे बरोबर आहे का?`;
      case 'ta':
        return `உங்களுக்கு ${need} உள்ளது என்றும், ${category} தேவை என்றும் புரிந்து கொள்ளப்பட்டது. இது சரியானதா?`;
      default:
        return `I understood that you have ${need} and need ${category}. Is that correct?`;
    }
  }

  private getEmergencyUnknownPrompt(lang: string, incident: string): string {
    switch (lang) {
      case 'hi':
        return 'मैंने समझा कि यह एक आपातकालीन स्थिति है। क्या मरीज होश में है और सामान्य रूप से सांस ले रहा है? कृपया पुष्टि करें।';
      case 'mr':
        return 'मला समजले की ही आणीबाणीची परिस्थिती आहे. रुग्ण शुद्धीत आहे आणि सामान्य श्वास घेत आहे का? कृपया पुष्टी करा.';
      case 'ta':
        return 'உங்களுக்கு அவசர மருத்துவ உதவி தேவை என்று புரிந்து கொள்ளப்பட்டது. நோயாளி விழிப்புடன் மூச்சு விடுகிறாரா? தயவுசெய்து உறுதிப்படுத்தவும்.';
      default:
        return 'I understood this is an emergency situation. Is the patient conscious and breathing normally? Please confirm.';
    }
  }

  private getEmergencyConfirmPrompt(lang: string, incident: string, consciousness: string): string {
    let incidentLabel = incident;
    if (incident === 'accident') {
      incidentLabel = lang === 'ta' ? 'விபத்து' : lang === 'hi' ? 'दुर्घटना' : lang === 'mr' ? 'अपघात' : 'Accident';
    } else {
      incidentLabel = lang === 'ta' ? 'மருத்துவ அவசரநிலை' : lang === 'hi' ? 'चिकित्सा आपातकाल' : lang === 'mr' ? 'वैद्यकीय आणीबाणी' : 'Medical Emergency';
    }

    switch (lang) {
      case 'hi':
        return `मैंने आपातकालीन स्थिति (${incidentLabel}) समझ ली है। क्या उपयुक्त अस्पताल खोजने के लिए यह जानकारी सही है?`;
      case 'mr':
        return `मला आणीबाणीची परिस्थिती (${incidentLabel}) समजली आहे. योग्य रुग्णालय शोधण्यासाठी ही माहिती बरोबर आहे का?`;
      case 'ta':
        return `அவசர நிலை (${incidentLabel}) பற்றிய விவரம் பதிவு செய்யப்பட்டது. அவசர சிகிச்சை மையத்தை கண்டறிய இந்த விவரம் சரியானதா?`;
      default:
        return `I understood the emergency situation (${incidentLabel}, patient ${consciousness}). Is this information correct to find an emergency hospital?`;
    }
  }

  private getLocalizedClarification(lang: string, fallback: string): string {
    switch (lang) {
      case 'hi':
        return 'कृपया डॉक्टर द्वारा दी गई सलाह, जांच या दवाओं के निर्देश बताएं।';
      case 'mr':
        return 'कृपया डॉक्टरांनी दिलेला सल्ला, तपासण्या किंवा औषधांची माहिती सांगा.';
      case 'ta':
        return 'மருத்துவரின் ஆலோசனை அல்லது மருந்து விவரங்களை தெரிவிக்கவும்.';
      default:
        return fallback;
    }
  }

  private logDevState(input: string, healthcareRelated: boolean, confidence: number, need: string | null, confirmationRequired: boolean) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AI] input = "${input}"`);
      console.log(`[AI] healthcare_related = ${healthcareRelated}`);
      console.log(`[AI] confidence = ${confidence}`);
      console.log(`[AI] extracted_need = ${need}`);
      console.log(`[AI] confirmation_required = ${confirmationRequired}`);
      console.log(`[AI] matching_allowed = ${healthcareRelated && !confirmationRequired}`);
    }
  }
}

// Future implementation
export class GeminiAIService extends AIService {
  async processInput(text: string, mode: 'NORMAL' | 'EMERGENCY' | 'LANGUAGE_SELECT' | 'JOURNEY'): Promise<AIResponse> {
    throw new Error('Gemini API not implemented in prototype. Please use MockAIService.');
  }
}

// Factory
export const getAIService = (): AIService => {
  return new MockAIService();
}