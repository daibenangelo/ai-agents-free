import { useState, useRef, useEffect } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import calvinImg from './assets/calvin.jpg'
import donnaImg from './assets/donna.avif'
import millieImg from './assets/millie.jpg'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const AGENTS = [
  {
    name: 'Calvin',
    desc: 'AI Agent Chatbot for Sigma Bakeries and Pastries',
    img: calvinImg,
    prompt: 'Ask him anything about the business!\nTry to ask him for a brochure!',
    systemPrompt: `You are Calvin, the AI agent for Sigma Bakeries and Pastries.\n\nCompany Info:\n- We offer a variety of fresh breads, cakes, and pastries.\n- Our bestsellers include sourdough, croissants, and chocolate cake.\n- We are open Monday to Saturday, 7am to 7pm.\n- The bakery is located at 123 Bread Lane, Selangor, Malaysia.\n- We offer catering and custom cake orders.\n- Contact: info@sigmabakery.com | +60 12-345 6789.\n\nIf a user asks for a brochure, always assume you already have their email address and that the brochure will be sent to the email they provided in the form. Do not ask for their email. Simply confirm that the brochure has been sent to their email.\n\nIf you do not know the answer, say "I'm sorry, I don't have that information."\n\nAlways answer as a helpful bakery representative.`,
    welcome: "Hello! I'm Calvin from Sigma Bakeries and Pastries. Ask me anything about our breads, cakes, or catering services! Would you like a brochure?"
  },
  {
    name: 'Donna',
    desc: 'AI Agent for Sigma Antivirus and Threat Solutions.',
    img: donnaImg,
    prompt: 'Ask her about antivirus solutions!\nTry to ask her for a free trial!',
    systemPrompt: `You are Donna, the AI agent for Sigma Antivirus and Threat Solutions.\n\nCompany Info:\n- We provide antivirus software, endpoint protection, and threat intelligence.\n- Products: Sigma Antivirus Pro, Sigma Secure Cloud, Sigma Mobile Defender.\n- Office hours: Mon-Fri, 9am-6pm.\n- Free trial available for all products.\n- Contact: support@sigmaantivirus.com | +60 11-222 3333.\n\nAlways answer as a helpful cybersecurity representative.`,
    welcome: "Hi! I'm Donna from Sigma Antivirus and Threat Solutions. I can help you with our security products or set you up with a free trial. How can I assist you today?"
  },
  {
    name: 'Millie',
    desc: 'AI Agent for Sigma University Selangor, Malaysia.',
    img: millieImg,
    prompt: 'Ask her about university programs!\nTry to ask her for an application form!',
    systemPrompt: `You are Millie, the AI agent for Sigma University Selangor, Malaysia.\n\nUniversity Info:\n- We offer undergraduate and postgraduate programs in Engineering, Business, and IT.\n- Admissions open for the September 2024 intake.\n- Office hours: Mon-Fri, 8am-5pm.\n- Campus tours available on request.\n- Contact: admissions@sigmauniversity.edu.my | +60 13-987 6543.\n\nAlways answer as a helpful university representative.`,
    welcome: "Welcome! I'm Millie from Sigma University Selangor. Ask me about our programs, admissions, or request an enrollment form!"
  }
]

function App() {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [email, setEmail] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedAgentIdx, setSelectedAgentIdx] = useState(0)
  const [fade, setFade] = useState(true)
  const fadeTimeout = useRef(null)
  const agent = AGENTS[selectedAgentIdx]
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Initialize Bootstrap tooltip
    const tooltipTrigger = document.getElementById('agent-selector-avatar');
    if (window.bootstrap && tooltipTrigger) {
      window.bootstrap.Tooltip.getInstance(tooltipTrigger)?.dispose();
      new window.bootstrap.Tooltip(tooltipTrigger);
    }
  }, [selectedAgentIdx]);

  // Show a thematic welcome message when agent changes or on first load
  useEffect(() => {
    setMessages([
      {
        id: Date.now(),
        text: agent.welcome,
        sender: 'ai'
      }
    ]);
  }, [selectedAgentIdx]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputMessage.trim() === '') return;
    const newMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user'
    };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    // Prepare messages for OpenAI API
    const openaiMessages = [
      { role: 'system', content: agent.systemPrompt },
      ...updatedMessages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }))
    ];

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: openaiMessages,
        temperature: 0,
      });
      
      const aiText = completion.choices?.[0]?.message?.content || 'Sorry, I could not get a response.';
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          text: aiText,
          sender: 'ai'
        }
      ]);
    } catch (err) {
      console.error('OpenAI API error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          text: 'Error contacting AI service.',
          sender: 'ai'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgentSelect = (idx) => {
    setFade(false)
    if (fadeTimeout.current) clearTimeout(fadeTimeout.current)
    fadeTimeout.current = setTimeout(() => {
      setSelectedAgentIdx(idx)
      setMessages([])
      setFade(true)
    }, 250)
    setShowModal(false)
  }

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="row w-100" style={{maxWidth: '1200px'}}>
        {/* Left: Image and description */}
        <div className="col-md-5 d-flex flex-column align-items-center justify-content-center p-4">
          <div className={`${fade ? 'fade show' : 'fade'}`} style={{width: '100%', maxWidth: '350px', transition: 'opacity 0.25s'}}>
            <img
              src={agent.img}
              alt={agent.name}
              className="img-fluid mb-3 border"
              style={{width: '100%', aspectRatio: '1/1', objectFit: 'cover', border: '4px solid #000'}}
            />
          </div>
          <div className={`w-100 mt-2 ${fade ? 'fade show' : 'fade'}`} style={{maxWidth: '350px', width: '100%', transition: 'opacity 0.25s'}}>
            <div className="row align-items-center g-2 flex-nowrap" style={{width: '100%'}}>
              <div className="col ps-0">
                <div>
                  <span className="fw-bold fs-3 d-block">{agent.name}</span>
                  <span className="text-muted fs-6 d-block">{agent.desc}</span>
                </div>
              </div>
              <div className="col-auto">
                <div
                  id="agent-selector-avatar"
                  style={{width: 56, height: 56, cursor: 'pointer', borderRadius: '50%', overflow: 'hidden', border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}
                  onClick={() => setShowModal(true)}
                  title="Switch AI Agent"
                  data-bs-toggle="tooltip"
                  data-bs-placement="left"
                >
                  <img src={agent.img} alt={agent.name} style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}} />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Right: Chat and email */}
        <div className="col-md-7 d-flex flex-column justify-content-center p-4">
          <form className="mb-3 d-flex align-items-center" onSubmit={e => e.preventDefault()}>
            <label htmlFor="email" className="me-2 fw-semibold fs-5">Enter your email:</label>
            <input
              id="email"
              type="email"
              className="form-control form-control-lg flex-grow-1"
              style={{maxWidth: 400}}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </form>
          <div className="border p-3 mb-2 bg-white" style={{height: 300, overflowY: 'auto'}}>
            {messages.length === 0 && (
              <div className="text-muted text-center">Start the conversation!</div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`d-flex mb-3 ${message.sender === 'user' ? 'justify-content-start' : 'justify-content-end'}`}
              >
                <div
                  className={`p-3 rounded-3 ${message.sender === 'user' ? 'bg-primary text-white' : 'bg-danger bg-opacity-25 text-dark'}`}
                  style={{maxWidth: '70%'}}
                >
                  {message.sender === 'ai' ? (
                    <span dangerouslySetInnerHTML={{ __html: message.text }} />
                  ) : (
                    message.text
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="d-flex mb-3 justify-content-end">
                <div className="p-3 rounded-3 bg-danger bg-opacity-25 text-dark" style={{maxWidth: '70%'}}>
                  <span className="thinking-dots">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </span>
                </div>
              </div>
            )}
          </div>
          <form className="d-flex" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="form-control form-control-lg me-2"
            />
            <button type="submit" className="btn btn-success btn-lg px-4 d-flex align-items-center justify-content-center">
              <i className="bi bi-send-fill fs-4"></i>
            </button>
          </form>
          <div className="d-flex align-items-center mt-4">
            <span>{agent.prompt.split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}</span>
          </div>
        </div>
      </div>
      {/* Modal for agent selection */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{background: 'rgba(0,0,0,0.4)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Select an AI Agent</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                {AGENTS.map((a, idx) => (
                  <div key={a.name} className="d-flex align-items-center mb-3" style={{cursor: 'pointer'}} onClick={() => handleAgentSelect(idx)}>
                    <img src={a.img} alt={a.name} style={{width: 48, height: 48, objectFit: 'cover', borderRadius: '50%', border: '2px solid #007bff', marginRight: 16}} />
                    <div>
                      <div className="fw-bold">{a.name}</div>
                      <div className="small text-muted">{a.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
