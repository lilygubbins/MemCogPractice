(() => {
  "use strict";

  const WORD_LISTS = [
    ["apple", "hammer", "candle", "bridge", "turtle", "pillow"],
    ["ladder", "lemon", "bucket", "guitar", "rabbit", "window"],
    ["camera", "blanket", "orange", "anchor", "button", "forest"]
  ];

  const STRATEGIES = [
    {
      id: "maintenance_rehearsal",
      name: "Maintenance Rehearsal",
      title: "Repeat the word",
      instruction: "When each word appears, repeat it silently in your mind. Keep saying the word to yourself until the next word appears. Focus on keeping the word active in your memory."
    },
    {
      id: "self_reference",
      name: "Self-Reference",
      title: "Connect the word to yourself",
      instruction: "When each word appears, think about how it relates to you personally. For example, consider whether you own it, use it, like it, or have an experience connected to it."
    },
    {
      id: "mental_imagery",
      name: "Mental Imagery",
      title: "Make a mental picture",
      instruction: "When each word appears, create a vivid mental image of the object. Imagine what it looks like, including its color, shape, size, or other details."
    }
  ];

  const WORD_DURATION_MS = 4000;
  const DISTRACTOR_SECONDS = 30;
  const $ = id => document.getElementById(id);
  const sections = ["welcome", "instructions", "study", "distractor", "recall", "results"];
  let session = null;
  let currentBlock = 0;
  let currentWord = 0;
  let wordTimer = null;
  let distractorTimer = null;
  let remainingSeconds = DISTRACTOR_SECONDS;
  let recallMatches = [];

  function showSection(id) {
    sections.forEach(section => $(section).classList.toggle("hidden", section !== id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function makeSession() {
    const strategies = shuffle(STRATEGIES);
    const lists = shuffle(WORD_LISTS);
    const blocks = strategies.map((strategy, index) => ({
      strategy,
      words: [...lists[index]]
    }));
    return {
      sessionId: `S${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      participantCode: $("participant").value.trim(),
      startedAt: new Date().toISOString(),
      blocks,
      distractorStart: null,
      distractorAnswers: "",
      recallText: "",
      completedAt: null,
      matches: []
    };
  }

  function startSession() {
    session = makeSession();
    currentBlock = 0;
    currentWord = 0;
    showBlockInstructions();
  }

  function showBlockInstructions() {
    const block = session.blocks[currentBlock];
    $("blockLabel").textContent = `BLOCK ${currentBlock + 1} OF 3`;
    $("blockProgress").textContent = `${currentBlock * 6} / 18 words`;
    $("progressFill").style.width = `${(currentBlock / 3) * 100}%`;
    $("strategyTag").textContent = block.strategy.name.toUpperCase();
    $("instructionTitle").textContent = block.strategy.title;
    $("instructionText").textContent = block.strategy.instruction;
    showSection("instructions");
  }

  function beginBlock() {
    currentWord = 0;
    showSection("study");
    showNextWord();
  }

  function showNextWord() {
    const block = session.blocks[currentBlock];
    if (currentWord >= block.words.length) {
      currentBlock++;
      if (currentBlock < 3) showBlockInstructions();
      else beginDistractor();
      return;
    }
    $("studyBlockLabel").textContent = `BLOCK ${currentBlock + 1} OF 3 · ${block.strategy.name.toUpperCase()}`;
    $("studyWordCount").textContent = `WORD ${currentWord + 1} OF 6`;
    $("studyProgressFill").style.width = `${((currentBlock * 6 + currentWord + 1) / 18) * 100}%`;
    $("studyWord").textContent = block.words[currentWord].toUpperCase();
    wordTimer = window.setTimeout(() => {
      currentWord++;
      showNextWord();
    }, WORD_DURATION_MS);
  }

  function beginDistractor() {
    session.distractorStart = Math.floor(100 + Math.random() * 900);
    remainingSeconds = DISTRACTOR_SECONDS;
    $("startingNumber").textContent = session.distractorStart;
    $("timer").textContent = remainingSeconds;
    $("countingInput").value = "";
    showSection("distractor");
    $("countingInput").focus();
    distractorTimer = window.setInterval(() => {
      remainingSeconds--;
      $("timer").textContent = remainingSeconds;
      if (remainingSeconds <= 0) {
        window.clearInterval(distractorTimer);
        session.distractorAnswers = $("countingInput").value;
        showSection("recall");
        $("recallInput").focus();
      }
    }, 1000);
  }

  function normalizeWord(word) {
    return word.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z]/g, "");
  }

  // Accept exact matches and a one-character typo for words of at least five letters.
  function editDistanceAtMostOne(a, b) {
    if (a === b) return true;
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0, j = 0, edits = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      edits++;
      if (edits > 1) return false;
      if (a.length > b.length) i++;
      else if (b.length > a.length) j++;
      else { i++; j++; }
    }
    if (i < a.length || j < b.length) edits++;
    return edits <= 1;
  }

  function scoreRecall() {
    const raw = $("recallInput").value;
    session.recallText = raw;
    const entries = raw.split(/[\s,;]+/).map(normalizeWord).filter(Boolean);
    const allTrials = [];
    session.blocks.forEach((block, blockIndex) => {
      block.words.forEach((word, wordIndex) => {
        allTrials.push({
          word, strategy: block.strategy.name, strategyId: block.strategy.id,
          blockOrder: blockIndex + 1, wordOrderInBlock: wordIndex + 1,
          recalled: false, matchedResponse: ""
        });
      });
    });

    const usedResponses = new Set();
    allTrials.forEach(trial => {
      const target = normalizeWord(trial.word);
      const matchIndex = entries.findIndex((entry, index) =>
        !usedResponses.has(index) && (entry === target ||
          (target.length >= 5 && entry.length >= 5 && editDistanceAtMostOne(entry, target)))
      );
      if (matchIndex !== -1) {
        trial.recalled = true;
        trial.matchedResponse = entries[matchIndex];
        usedResponses.add(matchIndex);
      }
    });
    session.matches = allTrials;
    recallMatches = allTrials;
    session.completedAt = new Date().toISOString();
    renderResults();
  }

  function renderResults() {
    const scores = session.blocks.map(block => {
      const trials = recallMatches.filter(t => t.strategyId === block.strategy.id);
      return { name: block.strategy.name, count: trials.filter(t => t.recalled).length };
    });
    $("scoreCards").innerHTML = scores.map(score => `
      <div class="score-card">
        <div class="name">${escapeHtml(score.name)}</div>
        <div class="score">${score.count}/6</div>
        <div class="detail">words recalled</div>
      </div>`).join("");
    const total = recallMatches.filter(t => t.recalled).length;
    $("totalScore").textContent = `Total recalled: ${total} out of 18 words`;
    showSection("results");
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char]));
  }

  function csvCell(value) {
    const str = String(value ?? "");
    return `"${str.replace(/"/g, '""')}"`;
  }

  function downloadCsv(filename, headers, rows) {
    const csv = [headers, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function downloadSummary() {
    const scores = {};
    session.blocks.forEach(block => {
      const key = block.strategy.id;
      const trials = recallMatches.filter(t => t.strategyId === key);
      scores[key] = trials.filter(t => t.recalled).length;
    });
    const total = recallMatches.filter(t => t.recalled).length;
    const headers = [
      "session_id", "participant_code", "started_at", "completed_at",
      "strategy_order", "maintenance_rehearsal_recalled", "self_reference_recalled",
      "mental_imagery_recalled", "total_recalled", "total_words", "distractor_start_number",
      "distractor_responses"
    ];
    const row = [
      session.sessionId, session.participantCode, session.startedAt, session.completedAt,
      session.blocks.map(b => b.strategy.name).join(" > "),
      scores.maintenance_rehearsal ?? 0, scores.self_reference ?? 0,
      scores.mental_imagery ?? 0, total, 18, session.distractorStart,
      session.distractorAnswers
    ];
    downloadCsv("memory_experiment_summary.csv", headers, [row]);
  }

  function downloadTrials() {
    const headers = [
      "session_id", "participant_code", "strategy_order", "strategy",
      "strategy_id", "word_list_position", "word", "recalled", "matched_response",
      "started_at", "completed_at"
    ];
    const rows = recallMatches.map(trial => [
      session.sessionId, session.participantCode, trial.blockOrder, trial.strategy,
      trial.strategyId, trial.wordOrderInBlock, trial.word,
      trial.recalled ? 1 : 0, trial.matchedResponse, session.startedAt, session.completedAt
    ]);
    downloadCsv("memory_experiment_trials.csv", headers, rows);
  }

  function restart() {
    if (wordTimer) window.clearTimeout(wordTimer);
    if (distractorTimer) window.clearInterval(distractorTimer);
    $("participant").value = "";
    $("recallInput").value = "";
    $("countingInput").value = "";
    session = null;
    showSection("welcome");
  }

  $("startBtn").addEventListener("click", startSession);
  $("beginBlockBtn").addEventListener("click", beginBlock);
  $("submitRecallBtn").addEventListener("click", scoreRecall);
  $("summaryDownload").addEventListener("click", downloadSummary);
  $("trialDownload").addEventListener("click", downloadTrials);
  $("restartBtn").addEventListener("click", restart);
})();
