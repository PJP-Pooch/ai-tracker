export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#03000a] text-white overflow-hidden select-none">
      {/* CSS Keyframes injected directly for smooth animations */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes float-delayed {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(10px) rotate(-3deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 8s ease-in-out infinite;
        }
      `}</style>

      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(88,28,135,0.15),transparent_60%)] animate-pulse-glow" />
      <div className="absolute -top-[10%] left-[20%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-[10%] right-[20%] w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Orbit Lines Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-40">
        <svg className="w-[1200px] h-[1200px] text-purple-500/10" viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="500" cy="500" rx="450" ry="180" stroke="currentColor" strokeWidth="1" transform="rotate(-20 500 500)" />
          <ellipse cx="500" cy="500" rx="350" ry="140" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" transform="rotate(15 500 500)" />
          <ellipse cx="500" cy="500" rx="250" ry="100" stroke="currentColor" strokeWidth="1.5" transform="rotate(-5 500 500)" />
        </svg>
      </div>

      {/* Floating Brand Nodes */}
      <div className="absolute inset-0 pointer-events-none z-10 w-full h-full max-w-7xl mx-auto">
        {/* Gemini Logo Node - Top Left */}
        <div className="absolute top-[20%] left-[10%] md:left-[15%] lg:left-[22%] animate-float pointer-events-auto">
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-full blur-md opacity-75 group-hover:opacity-100 transition duration-500" />
            <div className="relative w-12 h-12 rounded-full border border-white/10 bg-black/40 flex items-center justify-center backdrop-blur-md shadow-[0_0_15px_rgba(168,117,178,0.15)] group-hover:border-purple-500/30 transition duration-300">
              <svg className="w-5 h-5 group-hover:scale-110 transition duration-300" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="gemini-grad-top" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4e82ee" />
                    <stop offset="50%" stopColor="#b062ec" />
                    <stop offset="100%" stopColor="#e7706c" />
                  </linearGradient>
                </defs>
                <path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81" fill="url(#gemini-grad-top)" />
              </svg>
            </div>
          </div>
        </div>

        {/* ChatGPT Logo Node - Top Right */}
        <div className="absolute top-[24%] right-[10%] md:right-[15%] lg:right-[22%] animate-float-delayed pointer-events-auto">
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-full blur-md opacity-75 group-hover:opacity-100 transition duration-500" />
            <div className="relative w-12 h-12 rounded-full border border-white/10 bg-black/40 flex items-center justify-center backdrop-blur-md shadow-[0_0_15px_rgba(16,163,127,0.15)] group-hover:border-emerald-500/30 transition duration-300">
              <svg className="w-5 h-5 text-[#10a37f] group-hover:text-emerald-400 transition duration-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Claude / Anthropic Logo Node - Bottom Left */}
        <div className="absolute bottom-[20%] left-[12%] md:left-[18%] lg:left-[24%] animate-float-delayed pointer-events-auto">
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-full blur-md opacity-75 group-hover:opacity-100 transition duration-500" />
            <div className="relative w-12 h-12 rounded-full border border-white/10 bg-black/40 flex items-center justify-center backdrop-blur-md shadow-[0_0_15px_rgba(217,119,87,0.15)] group-hover:border-orange-500/30 transition duration-300">
              <svg className="w-5 h-5 text-[#d97757] group-hover:text-orange-400 transition duration-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Perplexity Logo Node - Bottom Right */}
        <div className="absolute bottom-[22%] right-[12%] md:right-[18%] lg:right-[24%] animate-float pointer-events-auto">
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 rounded-full blur-md opacity-75 group-hover:opacity-100 transition duration-500" />
            <div className="relative w-12 h-12 rounded-full border border-white/10 bg-black/40 flex items-center justify-center backdrop-blur-md shadow-[0_0_15px_rgba(20,128,141,0.15)] group-hover:border-cyan-500/30 transition duration-300">
              <svg className="w-5 h-5 text-[#20808d] group-hover:text-cyan-400 transition duration-300" viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" d="M8 .188a.5.5 0 0 1 .503.5V4.03l3.022-2.92.059-.048a.51.51 0 0 1 .49-.054.5.5 0 0 1 .306.46v3.247h1.117l.1.01a.5.5 0 0 1 .403.49v5.558a.5.5 0 0 1-.503.5H12.38v3.258a.5.5 0 0 1-.312.462.51.51 0 0 1-.55-.11l-3.016-3.018v3.448c0 .275-.225.5-.503.5a.5.5 0 0 1-.503-.5v-3.448l-3.018 3.019a.51.51 0 0 1-.548.11.5.5 0 0 1-.312-.463v-3.258H2.503a.5.5 0 0 1-.503-.5V5.215l.01-.1c.047-.229.25-.4.493-.4H3.62V1.469l.006-.074a.5.5 0 0 1 .302-.387.51.51 0 0 1 .547.102l3.023 2.92V.687c0-.276.225-.5.503-.5M4.626 9.333v3.984l2.87-2.872v-4.01zm3.877 1.113 2.871 2.871V9.333l-2.87-2.897zm3.733-1.668a.5.5 0 0 1 .145.35v1.145h.612V5.715H9.201zm-9.23 1.495h.613V9.13c0-.131.052-.257.145-.35l3.033-3.064h-3.79zm1.62-5.558H6.76L4.626 2.652zm4.613 0h2.134V2.652z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-20 w-full max-w-md px-6 py-12 flex flex-col items-center">
        {children}
      </div>
    </div>
  )
}
