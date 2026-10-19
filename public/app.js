// NeuroNemotron Frontend Client
document.addEventListener('DOMContentLoaded', () => {
  const queryInput = document.getElementById('queryInput');
  const runResearchBtn = document.getElementById('runResearchBtn');
  const depthButtons = document.querySelectorAll('.depth-btn');
  const promptChips = document.querySelectorAll('.prompt-chip');
  const nebiusKeyInput = document.getElementById('nebiusKeyInput');
  const tavilyKeyInput = document.getElementById('tavilyKeyInput');

  // Telemetry Elements
  const metricLatency = document.getElementById('metricLatency');
  const metricTokens = document.getElementById('metricTokens');
  const metricSavings = document.getElementById('metricSavings');
  const metricTavily = document.getElementById('metricTavily');

  // Stages
  const stages = {
    decompose: document.getElementById('stage-decompose'),
    search: document.getElementById('stage-search'),
    synthesize: document.getElementById('stage-synthesize'),
    graph: document.getElementById('stage-graph')
  };

  // Result Elements
  const reportContainer = document.getElementById('reportMarkdownContainer');
  const evidenceGrid = document.getElementById('evidenceGrid');
  const thoughtStreamLogs = document.getElementById('thoughtStreamLogs');
  const sourceCountBadge = document.getElementById('sourceCountBadge');

  // Canvas
  const canvas = document.getElementById('knowledgeGraphCanvas');
  const ctx = canvas.getContext('2d');

  let currentDepth = 'balanced';
  let activeReportMarkdown = '';

  // Mode Selection
  depthButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      depthButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDepth = btn.dataset.depth;
    });
  });

  // Prompt Chips
  promptChips.forEach(chip => {
    chip.addEventListener('click', () => {
      queryInput.value = chip.dataset.query;
    });
  });

  // Tabs Handling
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const targetPane = document.getElementById(btn.dataset.tab);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // Copy & Print Actions
  document.getElementById('copyReportBtn').addEventListener('click', () => {
    if (!activeReportMarkdown) return;
    navigator.clipboard.writeText(activeReportMarkdown);
    alert('Executive Brief copied to clipboard!');
  });

  document.getElementById('printReportBtn').addEventListener('click', () => {
    window.print();
  });

  // Knowledge Graph Physics Simulation
  let graphNodes = [];
  let graphLinks = [];
  let animationFrameId = null;

  function initDefaultGraph(topic) {
    const w = canvas.width;
    const h = canvas.height;
    graphNodes = [
      { id: 'root', label: topic ? topic.slice(0, 24) + '...' : 'Research Topic', x: w / 2, y: h / 2, vx: 0, vy: 0, color: '#76b900', radius: 24 },
      { id: 'nano', label: 'Nemotron Nano', x: w / 2 - 140, y: h / 2 - 70, vx: 0, vy: 0, color: '#a3e635', radius: 18 },
      { id: 'ultra', label: 'Nemotron 3 Ultra', x: w / 2 + 140, y: h / 2 + 70, vx: 0, vy: 0, color: '#10b981', radius: 20 },
      { id: 'tavily', label: 'Tavily Search', x: w / 2 - 160, y: h / 2 + 80, vx: 0, vy: 0, color: '#38bdf8', radius: 16 },
      { id: 'nebius', label: 'Nebius Token Factory', x: w / 2 + 160, y: h / 2 - 80, vx: 0, vy: 0, color: '#8b5cf6', radius: 18 }
    ];

    graphLinks = [
      { source: 'root', target: 'nano' },
      { source: 'nano', target: 'tavily' },
      { source: 'tavily', target: 'ultra' },
      { source: 'ultra', target: 'nebius' },
      { source: 'ultra', target: 'root' }
    ];

    if (!animationFrameId) renderGraphLoop();
  }

  function updateGraphData(data) {
    const w = canvas.width;
    const h = canvas.height;
    graphNodes = data.nodes.map((n, i) => ({
      ...n,
      x: w / 2 + (Math.cos((i / data.nodes.length) * Math.PI * 2) * 160),
      y: h / 2 + (Math.sin((i / data.nodes.length) * Math.PI * 2) * 100),
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: n.size || 16
    }));
    graphLinks = data.links;
  }

  function renderGraphLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Links
    ctx.lineWidth = 1.5;
    graphLinks.forEach(link => {
      const sNode = graphNodes.find(n => n.id === link.source);
      const tNode = graphNodes.find(n => n.id === link.target);
      if (sNode && tNode) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.moveTo(sNode.x, sNode.y);
        ctx.lineTo(tNode.x, tNode.y);
        ctx.stroke();
      }
    });

    // Draw Nodes
    graphNodes.forEach(node => {
      // Gentle floating motion
      node.x += node.vx;
      node.y += node.vy;
      if (node.x < node.radius || node.x > canvas.width - node.radius) node.vx *= -1;
      if (node.y < node.radius || node.y > canvas.height - node.radius) node.vy *= -1;

      // Outer glow
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius + 4, 0, Math.PI * 2);
      ctx.fillStyle = node.color + '22';
      ctx.fill();

      // Main Circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.shadowColor = node.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Text label
      ctx.font = '11px Inter, sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y + node.radius + 14);
    });

    animationFrameId = requestAnimationFrame(renderGraphLoop);
  }

  // Initial canvas sizing
  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  initDefaultGraph('Agentic Systems');

  // Logging Helper
  function appendLog(stage, message, timestamp) {
    const timeStr = timestamp || new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `log-entry ${stage}`;
    entry.innerHTML = `<span style="color:#64748b;">[${timeStr}]</span> <strong>[${stage}]</strong> ${message}`;
    thoughtStreamLogs.appendChild(entry);
    thoughtStreamLogs.scrollTop = thoughtStreamLogs.scrollHeight;
  }

  // Update Stage UI
  function updateStageStatus(stageId, status) {
    const el = stages[stageId];
    if (!el) return;
    const badge = el.querySelector('.step-badge');
    el.classList.remove('active', 'completed');
    badge.className = 'step-badge ' + (status === 'running' ? 'running' : status === 'completed' ? 'done' : 'pending');
    badge.textContent = status === 'running' ? 'Active' : status === 'completed' ? 'Done' : 'Pending';

    if (status === 'running') el.classList.add('active');
    if (status === 'completed') el.classList.add('completed');
  }

  // Run Research Handler
  runResearchBtn.addEventListener('click', async () => {
    const query = queryInput.value.trim();
    if (!query) return alert('Please enter a research query.');

    // UI Reset
    runResearchBtn.disabled = true;
    runResearchBtn.querySelector('.btn-text').textContent = 'Orchestrating Agents...';
    Object.keys(stages).forEach(k => updateStageStatus(k, 'pending'));
    thoughtStreamLogs.innerHTML = '';
    reportContainer.innerHTML = '<div class="placeholder-text">Synthesizing multi-tier agent responses...</div>';
    evidenceGrid.innerHTML = '';
    sourceCountBadge.textContent = '0';
    initDefaultGraph(query);

    appendLog('INIT', `Dispatching query to Nebius Token Factory with depth: ${currentDepth}`);

    try {
      const response = await fetch('/api/research/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          depth: currentDepth,
          nebiusKey: nebiusKeyInput.value.trim() || undefined,
          tavilyKey: tavilyKeyInput.value.trim() || undefined
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); // keep last incomplete event

        for (const line of lines) {
          const match = line.match(/^event:\s*(\w+)\ndata:\s*(.+)$/s);
          if (!match) continue;

          const eventType = match[1];
          const data = JSON.parse(match[2]);

          if (eventType === 'step') {
            updateStageStatus(data.id, data.status);
          } else if (eventType === 'log') {
            appendLog(data.stage, data.message, data.timestamp);
          } else if (eventType === 'sources') {
            sourceCountBadge.textContent = data.length;
            evidenceGrid.innerHTML = data.map((src, i) => `
              <div class="evidence-card">
                <div class="evidence-title">[${i + 1}] ${src.title}</div>
                <a class="evidence-url" href="${src.url}" target="_blank" rel="noreferrer">${src.url}</a>
                <p class="evidence-snippet">${src.snippet}</p>
              </div>
            `).join('');
          } else if (eventType === 'graph') {
            updateGraphData(data);
          } else if (eventType === 'metrics') {
            metricLatency.textContent = data.execution_time_seconds + 's';
            metricTokens.textContent = data.total_tokens.toLocaleString();
            metricSavings.textContent = '-' + data.estimated_cost_savings_pct + '%';
            metricTavily.textContent = data.tavily_api_calls;
          } else if (eventType === 'report') {
            activeReportMarkdown = data.markdown;
            reportContainer.innerHTML = marked.parse(data.markdown);
          } else if (eventType === 'complete') {
            appendLog('SUCCESS', data.message);
          }
        }
      }
    } catch (err) {
      appendLog('ERROR', 'Execution failed: ' + err.message);
    } finally {
      runResearchBtn.disabled = false;
      runResearchBtn.querySelector('.btn-text').textContent = 'Execute Autonomous Research';
    }
  });
});
