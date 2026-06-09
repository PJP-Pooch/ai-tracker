global.WebSocket = class WebSocket {};

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const projectId = 'fa1f38fb-ce6c-4a62-9bce-6c89ddc0be35';
    
    // Get brands and competitors
    const { data: brands } = await supabase.from('brands').select('id, name, domain, is_primary').eq('project_id', projectId);
    const { data: competitors } = await supabase.from('competitors').select('id, name, domain').eq('project_id', projectId);
    
    const primaryBrand = brands.find(b => b.is_primary) || brands[0];
    if (!primaryBrand) {
      console.log('No brand found');
      return;
    }

    console.log('Primary Brand:', primaryBrand);
    console.log('Competitors:', competitors);

    // 1. Fetch runs, prompts, and citations in a single query
    const { data: runs, error } = await supabase
      .from('runs')
      .select(`
        id,
        raw_response,
        prompt_id,
        prompts!inner (
          id,
          prompt_text,
          project_id
        ),
        citations (
          id,
          domain,
          url,
          brand_id,
          competitor_id
        )
      `)
      .eq('prompts.project_id', projectId)
      .eq('status', 'success');

    if (error) {
      console.error('Query Error:', error);
      return;
    }

    console.log(`\nSuccessfully fetched ${runs.length} runs with pre-loaded citations.`);

    const outreachOpportunities = {};

    for (const run of runs) {
      const text = run.raw_response || '';
      const runCitations = run.citations || [];
      
      // Check if any competitor is mentioned in the text or has their domain cited
      const hasCompetitorCitation = runCitations.some(c => 
        competitors.some(comp => c.domain === comp.domain || c.domain.includes(comp.domain))
      );
      const mentionedCompetitors = competitors.filter(comp => 
        text.toLowerCase().includes(comp.name.toLowerCase()) || 
        text.toLowerCase().includes(comp.domain.toLowerCase())
      );
      const isCompetitorRelevant = mentionedCompetitors.length > 0 || hasCompetitorCitation;

      // Check if our brand is cited directly in this run
      const isBrandCited = runCitations.some(c => 
        c.brand_id === primaryBrand.id || 
        c.domain === primaryBrand.domain || 
        c.domain.includes(primaryBrand.domain)
      );

      // Candidate run: competitor is cited/mentioned, but our brand is NOT cited
      if (isCompetitorRelevant && !isBrandCited) {
        for (const citation of runCitations) {
          const cDomain = citation.domain;
          
          // Skip if it's our own brand domain or a competitor's own domain
          const isOwnDomain = cDomain === primaryBrand.domain || cDomain.includes(primaryBrand.domain);
          const isCompetitorDomain = competitors.some(comp => 
            cDomain === comp.domain || cDomain.includes(comp.domain)
          );
          
          if (isOwnDomain || isCompetitorDomain) continue;

          if (!outreachOpportunities[cDomain]) {
            outreachOpportunities[cDomain] = {
              domain: cDomain,
              competitorCitations: 0,
              competitorsCited: new Set(),
              promptsCount: new Set(),
              sampleUrl: citation.url,
              samplePrompt: run.prompts ? run.prompts.prompt_text : ''
            };
          }
          
          outreachOpportunities[cDomain].competitorCitations += 1;
          mentionedCompetitors.forEach(comp => outreachOpportunities[cDomain].competitorsCited.add(comp.name));
          outreachOpportunities[cDomain].promptsCount.add(run.prompt_id);
        }
      }
    }

    const results = Object.values(outreachOpportunities).map(o => ({
      domain: o.domain,
      competitorCitations: o.competitorCitations,
      competitorsCited: Array.from(o.competitorsCited).join(', ') || 'Competitors mentioned in response',
      promptsCount: o.promptsCount.size,
      sampleUrl: o.sampleUrl,
      samplePrompt: o.samplePrompt
    })).sort((a, b) => b.competitorCitations - a.competitorCitations);

    console.log('\n--- Proposed JS-based Outreach Opportunities Result ---');
    console.log(results);

  } catch (err) {
    console.error(err);
  }
}

run();
