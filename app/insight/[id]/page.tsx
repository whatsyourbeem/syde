import { Metadata, ResolvingMetadata } from "next";
import { createClient } from "@/lib/supabase/server";
import InsightDetailClient from "@/components/insight/insight-detail-client";
import TiptapViewer from "@/components/common/tiptap-viewer";

interface InsightDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

export async function generateMetadata(
    { params }: InsightDetailPageProps,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { id } = await params;
    const supabase = await createClient();

    const { data: insight } = await supabase
        .from("insights")
        .select("title, summary, content, image_url")
        .eq("id", id)
        .single();

    if (!insight) {
        return { title: "Insight Not Found - SYDE" };
    }

    const title = `${insight.title} - SYDE 인사이트`;

    let plainText = "";
    if (insight.summary) {
        plainText = insight.summary;
    } else {
        try {
            const parsed = JSON.parse(insight.content);
            const extractText = (node: any): string => {
                if (node.type === "text" && node.text) return node.text;
                if (node.content && Array.isArray(node.content)) {
                    return node.content.map(extractText).join(" ");
                }
                return "";
            };
            plainText = extractText(parsed).trim();
        } catch (e) {
            plainText = insight.content || "";
        }
    }

    const description =
        plainText.length > 160 ? plainText.slice(0, 160) + "..." : plainText || "SYDE 인사이트를 확인해보세요.";
    const images = insight.image_url ? [insight.image_url] : ["/we-are-syders.png"];

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images,
            type: "article",
            url: `/insight/${id}`,
        },
    };
}

export default async function InsightDetailPage({ params }: InsightDetailPageProps) {
    const { id } = await params;
    return <InsightDetailClient id={id} />;
}
