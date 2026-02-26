document.addEventListener("DOMContentLoaded", function () {
  // Find all code block containers.
  // In Jekyll (Kramdown), code blocks are often wrapped in <div class="highlighter-rouge"> or just <pre><code>
  // We'll target <pre class="highlight"> or parent <div> containers.
  // The most reliable way is often targeting <div class="highlight"> which contains the <pre>.
  
  const codeBlocks = document.querySelectorAll("div.highlighter-rouge, div.highlight");

  // Create the modal element once
  const modal = document.createElement("div");
  modal.className = "code-viewer-modal";
  modal.innerHTML = `
    <div class="code-viewer-content">
      <div class="code-viewer-header">
        <span class="code-viewer-title">Code Viewer</span>
        <button class="code-viewer-close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
      </div>
      <div class="code-viewer-body"></div>
    </div>
  `;
  document.body.appendChild(modal);

  const modalBody = modal.querySelector(".code-viewer-body");
  const closeBtn = modal.querySelector(".code-viewer-close");

  // Function to close modal
  function closeModal() {
    modal.classList.remove("active");
    document.body.style.overflow = ""; // Restore scrolling
  }

  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
  });

  // Function to open modal
  function openModal(codeContent) {
      modalBody.innerHTML = "";
      const clone = codeContent.cloneNode(true);
      modalBody.appendChild(clone);
      modal.classList.add("active");
      document.body.style.overflow = "hidden"; // Prevent background scrolling
  }

  codeBlocks.forEach((block) => {
    // Ensure the block is relatively positioned for the button
    if (getComputedStyle(block).position === "static") {
      block.style.position = "relative";
    }

    // Create the expand button
    const btn = document.createElement("button");
    btn.className = "code-viewer-expand-btn";
    btn.title = "Expand Code";
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 3h6v6"></path>
        <path d="M9 21H3v-6"></path>
        <path d="M21 3l-7 7"></path>
        <path d="M3 21l7-7"></path>
      </svg>
    `;

    // Add button to the block
    block.appendChild(btn);

    // Add click event
    btn.addEventListener("click", () => {
        // Find the actual <pre> or <code> element to display
        const codeElement = block.querySelector("pre") || block.querySelector("code");
        if (codeElement) {
            openModal(codeElement);
        }
    });
  });
});
