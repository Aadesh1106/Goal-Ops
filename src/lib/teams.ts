// ============================================================
// GoalOps Enterprise — Microsoft Teams Webhook Connector
// ============================================================

const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL || '';

/**
 * Sends a structured connector card to the MS Teams Webhook
 */
async function postToTeams(cardPayload: any) {
  if (!TEAMS_WEBHOOK_URL) {
    console.log(`\n============================================================`);
    console.log(`📡 [MS Teams Integration] Simulated Channel Post Successful!`);
    console.log(`Summary: ${cardPayload.summary}`);
    console.log(`Details:`, JSON.stringify(cardPayload.sections?.[0]?.facts, null, 2));
    console.log(`Deep Link Action:`, cardPayload.potentialAction?.[0]?.targets?.[0]?.uri);
    console.log(`============================================================\n`);
    return { success: true, simulated: true };
  }

  try {
    const res = await fetch(TEAMS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cardPayload),
    });

    if (!res.ok) {
      console.error(`[MS Teams] Webhook failed with status: ${res.status}`);
      return { success: false, error: `Status ${res.status}` };
    }

    return { success: true };
  } catch (err: any) {
    console.error(`[MS Teams] Webhook error:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Triggered when an employee submits their Goal Sheet
 */
export async function notifyGoalSubmitted(params: {
  employeeName: string;
  employeeCode: string;
  department: string;
  goalCount: number;
  totalWeightage: number;
  viewLink: string;
}) {
  const card = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": "818cf8", // Indiglo/GoalOps primary
    "summary": `Goal Sheet Submitted by ${params.employeeName}`,
    "sections": [{
      "activityTitle": "📝 **Goal Sheet Submitted for Review**",
      "activitySubtitle": `Employee: ${params.employeeName} (${params.employeeCode})`,
      "activityImage": "https://img.icons8.com/color/96/todo-list.png",
      "facts": [
        { "name": "Department", "value": params.department },
        { "name": "Total Goals", "value": `${params.goalCount} Goals` },
        { "name": "Total Weightage", "value": `${params.totalWeightage}%` },
        { "name": "Status", "value": "Pending L1 Approval" }
      ],
      "markdown": true
    }],
    "potentialAction": [{
      "@type": "OpenUri",
      "name": "Review Goal Sheet",
      "targets": [{ "os": "default", "uri": params.viewLink }]
    }]
  };

  return postToTeams(card);
}

/**
 * Triggered when a manager approves or returns a Goal Sheet
 */
export async function notifyGoalStatusChanged(params: {
  employeeName: string;
  managerName: string;
  action: 'approved' | 'returned for rework';
  comment: string;
  viewLink: string;
}) {
  const isApproved = params.action === 'approved';
  const color = isApproved ? "10b981" : "f59e0b"; // green vs amber
  const icon = isApproved 
    ? "https://img.icons8.com/color/96/checked-checkbox.png"
    : "https://img.icons8.com/color/96/undo.png";

  const card = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": color,
    "summary": `Goal Sheet ${params.action.toUpperCase()} by ${params.managerName}`,
    "sections": [{
      "activityTitle": isApproved 
        ? "✅ **Goal Sheet Approved & Locked**" 
        : "⚠️ **Goal Sheet Returned for Rework**",
      "activitySubtitle": `Employee: ${params.employeeName} | Manager: ${params.managerName}`,
      "activityImage": icon,
      "facts": [
        { "name": "Action Taken", "value": params.action.toUpperCase() },
        { "name": "Manager Remarks", "value": params.comment || "_No comments added_" }
      ],
      "markdown": true
    }],
    "potentialAction": [{
      "@type": "OpenUri",
      "name": "View Goal Sheet",
      "targets": [{ "os": "default", "uri": params.viewLink }]
    }]
  };

  return postToTeams(card);
}

/**
 * Triggered when an employee logs a Quarterly Check-in
 */
export async function notifyCheckinLogged(params: {
  employeeName: string;
  goalTitle: string;
  quarter: string;
  plannedValue: number;
  actualValue: number;
  progressPercentage: number;
  progressStatus: string;
  viewLink: string;
}) {
  const card = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": "3b82f6", // Blue for tracking
    "summary": `Q${params.quarter.slice(1)} Check-in Logged by ${params.employeeName}`,
    "sections": [{
      "activityTitle": "📊 **New Quarterly Check-in Logged**",
      "activitySubtitle": `Employee: ${params.employeeName}`,
      "activityImage": "https://img.icons8.com/color/96/combo-chart.png",
      "facts": [
        { "name": "Quarter", "value": params.quarter },
        { "name": "Goal", "value": params.goalTitle },
        { "name": "Planned vs. Actual", "value": `${params.plannedValue} planned vs. **${params.actualValue}** actual` },
        { "name": "Progress Calculated", "value": `**${params.progressPercentage}%** (${params.progressStatus})` }
      ],
      "markdown": true
    }],
    "potentialAction": [{
      "@type": "OpenUri",
      "name": "Review Progress",
      "targets": [{ "os": "default", "uri": params.viewLink }]
    }]
  };

  return postToTeams(card);
}
