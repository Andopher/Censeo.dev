
import { TEMPLATES } from "@/lib/templates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";

export default function NewTestPage() {
    return (
        <main className="min-h-screen p-8 max-w-5xl mx-auto">
            <div className="mb-8">
                <Link href="/dashboard" className="inline-flex items-center text-sm text-secondary hover:text-accent mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Select a Template</h1>
                <p className="text-secondary mt-2">Choose a structure for your interview. You can customize the scenario and questions next.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {TEMPLATES.map((template) => (
                    <Card key={template.type} className="hover:border-accent transition-all cursor-pointer flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-xl">{template.title}</CardTitle>
                            <CardDescription className="mt-2 min-h-[3rem]">
                                {template.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="mt-auto">
                            <Link href={`/new/create?type=${template.type}`}>
                                <Button className="w-full">
                                    Select
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </main>
    );
}
