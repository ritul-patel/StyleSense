import re

def fix_file(filepath, page_name):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add Navbar import if not exists
    if 'import Navbar' not in content:
        content = re.sub(
            r'(import Link from "next/link";|import { useSavedOutfits } from "@/app/context/SavedOutfitsContext";|import RequireAuth from "../components/RequireAuth";|import posthog from "posthog-js";)',
            r'\1\nimport Navbar from "@/app/components/Navbar";',
            content,
            count=1
        )

    # Replace top nav
    content = re.sub(
        r'<nav className="fixed top-0 w-full z-50[^"]*">.*?</nav>',
        f'<Navbar activePath="{page_name}" />',
        content,
        flags=re.DOTALL
    )
    
    content = re.sub(
        r'<nav className="bg-\[#fcf9f8\]/70 backdrop-blur-xl fixed top-0 left-0 right-0 z-50 border-b border-black/5">.*?</nav>',
        f'<Navbar activePath="{page_name}" />',
        content,
        flags=re.DOTALL
    )

    content = re.sub(
        r'<header className="bg-\[#fcf9f8\]/70 backdrop-blur-xl fixed top-0 left-0 right-0 z-50 border-b border-black/5">.*?</header>',
        f'<Navbar activePath="{page_name}" />',
        content,
        flags=re.DOTALL
    )

    # Replace max-w-[1920px] with max-w-[1440px]
    content = re.sub(r'max-w-\[1920px\]', 'max-w-[1440px]', content)
    content = re.sub(r'max-w-4xl', 'max-w-[1440px]', content)

    # Remove mobile bottom nav
    content = re.sub(
        r'<nav className="(fixed bottom-0 left-0 w-full flex justify-around items-center px-6 pb-8 pt-4|md:hidden fixed bottom-0 left-0 w-full z-50).*?</nav>',
        '',
        content,
        flags=re.DOTALL
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_file('src/app/discover/page.tsx', 'discover')
fix_file('src/app/wardrobe/page.tsx', 'wardrobe')
fix_file('src/app/history/page.tsx', 'history')
fix_file('src/app/analysis/page.tsx', 'analysis')
fix_file('src/app/outfit/[id]/page.tsx', 'outfit')
