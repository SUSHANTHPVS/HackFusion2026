import { Link2, MessageCircleReply } from "lucide-react";
import { WHATSAPP_GROUP_LINK } from "../utils/constants";

function buildInviteMessage(teamName, memberName) {
  const lines = [
    `Hi ${memberName},`,
    `Your team ${teamName} has completed hackathon payment.`,
    `Join the WhatsApp group here: ${WHATSAPP_GROUP_LINK}`
  ];

  return encodeURIComponent(lines.join("\n"));
}

function buildInviteUrl(mobile, teamName, memberName) {
  const digitsOnly = String(mobile || "").replace(/\D/g, "");

  if (!digitsOnly) {
    return "";
  }

  const whatsappMobile = digitsOnly.length === 10 ? `91${digitsOnly}` : digitsOnly;
  return `https://wa.me/${whatsappMobile}?text=${buildInviteMessage(teamName, memberName)}`;
}

export function WhatsAppAccessCard({ payment, team }) {
  if (!payment || payment.status !== "success") {
    return null;
  }

  const teammates = Array.isArray(team?.teammates) ? team.teammates : [];
  const participationType = payment.participationType || team?.participationType || "individual";
  const hasTeammates = participationType === "team" && teammates.length > 0;

  return (
    <section className="glass-card rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">WhatsApp Access</p>
          <h2 className="mt-2 text-2xl font-extrabold text-slate-900">Join the hackathon WhatsApp group</h2>
          <p className="mt-2 text-sm text-slate-700">
            Your payment has been verified. You can now join the official group and share invitations with your teammates.
          </p>
        </div>

        <a
          href={WHATSAPP_GROUP_LINK}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <Link2 size={16} /> Join WhatsApp Group
        </a>
      </div>

      {hasTeammates ? (
        <div className="mt-5 rounded-xl border border-slate-200 bg-white/80 p-4">
          <p className="text-sm font-semibold text-slate-900">Teammate invitations</p>
          <p className="mt-1 text-xs text-slate-500">Send the group link to each teammate on WhatsApp using the mobile numbers you entered during registration.</p>

          <div className="mt-4 grid gap-3">
            {teammates.map((member, index) => {
              const mobile = String(member?.mobile || "").trim();
              const inviteUrl = buildInviteUrl(mobile, team?.name || "your team", member?.name || `Teammate ${index + 1}`);

              return (
                <div key={`${member?.name || "member"}-${index}`} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{member?.name || `Teammate ${index + 1}`}</p>
                    <p className="text-xs text-slate-500">{mobile || "Mobile number missing"}</p>
                  </div>
                  <a
                    href={inviteUrl || WHATSAPP_GROUP_LINK}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                      mobile ? "bg-cyan-600 hover:bg-cyan-700" : "cursor-not-allowed bg-slate-400"
                    }`}
                    aria-disabled={!mobile}
                    onClick={(event) => {
                      if (!mobile) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <MessageCircleReply size={16} /> Send Invite on WhatsApp
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
