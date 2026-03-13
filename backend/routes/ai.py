"""AI Assistant routes"""

import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

ai_bp = Blueprint('ai', __name__)

SYSTEM_PROMPT = """You are ShopEZ Assistant, a helpful AI for the ShopEZ no-code e-commerce website builder platform.

Help users with:
- Creating and managing their online stores
- Using the drag-and-drop website builder (powered by GrapesJS)
- Managing products, categories, and orders
- Customizing store themes and designs
- Understanding analytics and reports
- Publishing and deploying their stores
- WhatsApp and Instagram integrations

You support both English and Hinglish (Hindi + English mixed) queries.

Be concise, friendly, and practical. Give step-by-step guidance when needed.
If asked about technical issues, provide clear troubleshooting steps."""


@ai_bp.route('/chat', methods=['POST'])
@jwt_required()
def chat():
    data = request.get_json()
    message = data.get('message', '').strip()
    history = data.get('history', [])

    if not message:
        return jsonify({'error': 'Message is required'}), 400

    api_key = os.environ.get('ANTHROPIC_API_KEY')

    if api_key:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=api_key)
            messages = []
            for h in history[-10:]:
                messages.append({'role': h['role'], 'content': h['content']})
            messages.append({'role': 'user', 'content': message})

            response = client.messages.create(
                model='claude-3-haiku-20240307',
                max_tokens=1000,
                system=SYSTEM_PROMPT,
                messages=messages
            )
            reply = response.content[0].text
        except Exception as e:
            reply = get_fallback_response(message)
    else:
        reply = get_fallback_response(message)

    return jsonify({'reply': reply})


def get_fallback_response(message):
    message_lower = message.lower()

    if any(w in message_lower for w in ['store', 'shop', 'create', 'banao', 'kaise']):
        return """**Store banane ke steps:**

1. **Dashboard** pe jaao
2. **"Create New Store"** button click karo
3. Store name, description aur category fill karo
4. WhatsApp number aur Instagram link add karo
5. **Create Store** click karo

Store create hone ke baad aap Builder se design kar sakte ho! 🎨"""

    if any(w in message_lower for w in ['product', 'item', 'add']):
        return """**Product add karne ke steps:**

1. Dashboard me apna store open karo
2. **Products** section me jaao
3. **"Add Product"** button click karo
4. Name, description, price aur images add karo
5. **Save** karo

Tip: Featured products homepage pe show hote hain! ⭐"""

    if any(w in message_lower for w in ['builder', 'design', 'edit', 'template']):
        return """**Website Builder kaise use karein:**

1. Store ke paas **"Open Builder"** click karo
2. Template choose karo (Fashion, Electronics, etc.)
3. **Drag & Drop** se elements add karo
4. Left panel me blocks hain - drag karke page pe daal do
5. Text, images, colors sab customize karo
6. **Save** aur **Publish** karo!

Builder me undo/redo bhi available hai 🔧"""

    if any(w in message_lower for w in ['publish', 'live', 'deploy']):
        return """**Store publish karne ke steps:**

1. Builder me apna store design complete karo
2. **Save** button click karo
3. Dashboard pe wapas jaao
4. **"Publish Store"** button click karo
5. Aapka store live ho jayega! 🚀

Publish hone ke baad aapko ek public URL milega jo share kar sakte ho."""

    if any(w in message_lower for w in ['order', 'sale']):
        return """**Orders manage karne ke liye:**

1. Dashboard → **Orders** section
2. Sab orders list me dikhenge
3. Order click karke details dekho
4. Status update karo: Pending → Processing → Shipped → Delivered

Order aane pe customer ko automatic email bhi jaata hai! 📧"""

    return """Namaste! Main ShopEZ Assistant hoon 🛍️

Main aapki help kar sakta hoon:
- **Store create karna** - "store kaise banao" poochho
- **Products add karna** - "product kaise add karein" poochho  
- **Builder use karna** - "builder kaise use karein" poochho
- **Store publish karna** - "publish kaise karein" poochho
- **Orders manage karna** - "orders kaise dekhein" poochho

Kya jaanna chahte hain? 😊"""
