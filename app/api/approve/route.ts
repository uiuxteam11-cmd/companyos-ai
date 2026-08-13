import { NextResponse } from "next/server";

import { resolveApproval } from "@/lib/agents/approval-manager";

type ApprovalBody = {
  id?: string;
  decision?: "approve" | "reject" | "approved" | "rejected";
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ApprovalBody;

    if (!body.id?.trim()) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 },
      );
    }

    if (!body.decision) {
      return NextResponse.json(
        { error: "decision is required" },
        { status: 400 },
      );
    }

    const normalizedDecision =
      body.decision === "approved" ? "approve" : body.decision === "rejected" ? "reject" : body.decision;

    if (normalizedDecision !== "approve" && normalizedDecision !== "reject") {
      return NextResponse.json(
        { error: "decision must be approve or reject" },
        { status: 400 },
      );
    }

    resolveApproval(body.id.trim(), normalizedDecision);

    return NextResponse.json({ success: true, decision: normalizedDecision });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to resolve approval",
      },
      { status: 500 },
    );
  }
}
