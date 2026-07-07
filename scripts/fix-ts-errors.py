#!/usr/bin/env python3
"""Fix TypeScript errors in admin route files."""
import os
import re
from pathlib import Path

ROOT = Path("/home/z/my-project/src/app/api/admin")

# 1. Fix archive field issue: models without 'archived' field should skip the soft-delete branch
# Models WITHOUT 'archived' field: ApiKey, AuditLog, Banner, FeatureFlag, Integration, NotificationLog, Offer, Settlement, SupportTicket, Wallet
# We'll wrap the archive attempt in a try-catch that already exists, but we need to remove the data.archived key for those

NO_ARCHIVE = {"api-keys", "audit-logs", "banners", "feature-flags", "integrations", "notifications", "offers", "settlements", "support", "wallets"}

# Fix [id]/route.ts files - replace the soft-delete block
for module_name in NO_ARCHIVE:
    f = ROOT / module_name / "[id]" / "route.ts"
    if not f.exists():
        continue
    content = f.read_text()
    # Replace the soft-delete block to do hard delete directly (no archive attempt)
    old = """    // Try archive first (if model supports it)
    if (!hard) {
      try {
        const item = await db.MODELNAME.update({ where: { id: Number(id) }, data: { archived: true } });
        return NextResponse.json({ ok: true, archived: true, item });
      } catch {
        // fall through to hard delete
      }
    }
    await db.MODELNAME.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true, deleted: true });"""
    # Get actual model name from file
    m = re.search(r'db\.(\w+)\.update', content)
    if m:
        model = m.group(1)
        old = old.replace("MODELNAME", model)
        new = f"""    // This model doesn't support archive — hard delete
    await db.{model}.delete({{ where: {{ id: Number(id) }} }});
    return NextResponse.json({{ ok: true, deleted: true }});"""
        content = content.replace(old, new)
        f.write_text(content)
        print(f"✅ Fixed {module_name}/[id]/route.ts")

# 2. Fix the archive filter in route.ts (list) for these modules
for module_name in NO_ARCHIVE:
    f = ROOT / module_name / "route.ts"
    if not f.exists():
        continue
    content = f.read_text()
    # Remove the 'archived' where clause
    old = 'if ("archived" in db.MODELNAME.fields) where.archived = archived;'
    m = re.search(r'db\.(\w+)\.findMany', content)
    if m:
        model = m.group(1)
        old_with_model = old.replace("MODELNAME", model)
        if old_with_model in content:
            new = '// archived filter not applicable for this model'
            content = content.replace(old_with_model, new)
            f.write_text(content)
            print(f"✅ Fixed {module_name}/route.ts archived filter")

print("Done!")
