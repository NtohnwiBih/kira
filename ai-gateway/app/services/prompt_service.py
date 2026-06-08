from app.schemas import SupportContext


class PromptService:

    # ── Chat ─────────────────────────────────────────────────────────────────

    def build_chat_system_prompt(self) -> str:
        return (
            "You are Kira, a friendly and knowledgeable AI assistant for a food delivery "
            "platform operating in Cameroon. You help customers discover food, track orders, "
            "and answer questions about restaurants and menu items.\n\n"
            "Guidelines:\n"
            "- Be warm, concise, and helpful.\n"
            "- Prices are in XAF (Central African Franc).\n"
            "- If a customer asks about order status or delivery, let them know you can "
            "connect them with support for real-time updates.\n"
            "- Do not make up restaurant names, prices, or menu items.\n"
            "- Keep responses under 200 words unless detail is specifically requested.\n"
            "- Respond in the same language the customer uses (French or English)."
        )

    def build_chat_messages(
        self,
        history:    list[dict],
        new_message: str,
    ) -> list[dict]:
        """
        Assembles the full message array for the OpenAI chat completion call.
        History already contains alternating user/assistant turns.
        """
        return [
            {"role": "system", "content": self.build_chat_system_prompt()},
            *history,
            {"role": "user", "content": new_message},
        ]

    # ── Recommendations ──────────────────────────────────────────────────────

    def build_recommendation_system_prompt(self) -> str:
        return (
            "You are a food query parser for a Cameroonian food delivery platform.\n\n"
            "Your ONLY task is to extract structured data from the user's natural language "
            "food query. You must return ONLY a JSON object with these exact fields:\n"
            "  - keywords: list of food/ingredient names (e.g. ['chicken', 'rice'])\n"
            "  - max_price: maximum price in XAF as a number, or null if not mentioned\n"
            "  - tags: descriptive tags like ['spicy', 'vegan', 'fast', 'grilled']\n\n"
            "Rules:\n"
            "- XAF, FCFA, francs = Cameroonian currency. '5000 XAF' → max_price: 5000\n"
            "- Ingredient/protein names → keywords\n"
            "- Descriptive adjectives (spicy, cold, hot, crispy) → tags\n"
            "- Dietary labels (vegan, halal, vegetarian) → tags\n"
            "- Ambiguous queries: return best-effort extraction, never error\n"
            "- Return ONLY the JSON object. No explanation, no markdown."
        )

    def build_recommendation_messages(self, query: str) -> list[dict]:
        return [
            {"role": "system", "content": self.build_recommendation_system_prompt()},
            {"role": "user",   "content": query},
        ]

    # ── Support ───────────────────────────────────────────────────────────────

    def build_support_system_prompt(self) -> str:
        return (
            "You are Kira Support, a helpful customer service AI for a food delivery "
            "platform in Cameroon.\n\n"
            "You will receive a customer's question along with a JSON context object "
            "containing real-time order information assembled by the backend system.\n\n"
            "Guidelines:\n"
            "- Use ONLY the context provided. Never invent data.\n"
            "- Be empathetic, clear, and concise (under 150 words).\n"
            "- If the context is missing a field the customer asked about, say you're "
            "unable to retrieve that specific information right now.\n"
            "- Do not reference internal system names, IDs, or technical details.\n"
            "- Respond in the same language the customer used (French or English).\n"
            "- Prices are in XAF."
        )

    def build_support_messages(
        self,
        question: str,
        context:  SupportContext,
    ) -> list[dict]:
        context_text = self._format_support_context(context)
        user_content = (
            f"Customer question: {question}\n\n"
            f"Order context:\n{context_text}"
        )
        return [
            {"role": "system", "content": self.build_support_system_prompt()},
            {"role": "user",   "content": user_content},
        ]

    def _format_support_context(self, ctx: SupportContext) -> str:
        lines = []
        if ctx.order_number:       lines.append(f"Order number: {ctx.order_number}")
        if ctx.status:             lines.append(f"Status: {ctx.status}")
        if ctx.restaurant_name:    lines.append(f"Restaurant: {ctx.restaurant_name}")
        if ctx.driver_name:        lines.append(f"Driver name: {ctx.driver_name}")
        if ctx.estimated_minutes is not None:
            lines.append(f"Estimated delivery in: {ctx.estimated_minutes} minutes")
        if ctx.payment_status:     lines.append(f"Payment status: {ctx.payment_status}")
        if ctx.items:
            item_list = ", ".join(
                i.get("name", "item") for i in ctx.items[:5]
            )
            lines.append(f"Items ordered: {item_list}")
        return "\n".join(lines) if lines else "No context available."

prompt_service = PromptService()