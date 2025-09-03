import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PromotionalEmailRequest {
  subject: string;
  content: string;
  targetAudience: string;
  recipients?: string[];
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject, content, targetAudience, recipients, userId }: PromotionalEmailRequest = await req.json();

    // Fetch store settings from database
    const { data: storeSettings, error: settingsError } = await supabase
      .from('store_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsError) {
      console.log('No store settings found, using defaults');
    }

    // Use settings from database or fallback to defaults
    const settings = storeSettings || {
      store_name: 'Fresh Grocery Store',
      store_tagline: 'Your neighborhood grocery destination',
      store_address: '123 Main Street',
      store_city: 'City',
      store_state: 'State',
      store_zip: '12345',
      from_email: 'promotions@resend.dev',
      website_url: '#'
    };

    let emailRecipients: string[] = [];

    if (recipients && recipients.length > 0) {
      // Use provided recipients
      emailRecipients = recipients;
    } else {
      // Fetch customers from database based on target audience
      console.log(`Fetching customers for target audience: ${targetAudience}`);
      
      let query = supabase.from('customers').select('email, name, tier').eq('user_id', userId);
      
      // Filter based on target audience
      switch (targetAudience) {
        case 'Premium Members':
          query = query.in('tier', ['Gold', 'Platinum']);
          break;
        case 'Loyalty Members':
          query = query.in('tier', ['Silver', 'Gold', 'Platinum']);
          break;
        case 'New Customers':
          query = query.eq('tier', 'Bronze');
          break;
        default:
          // 'All Customers' - no additional filter needed
          break;
      }
      
      const { data: customers, error } = await query;
      
      if (error) {
        throw new Error(`Failed to fetch customers: ${error.message}`);
      }
      
      emailRecipients = customers?.map(customer => customer.email) || [];
      console.log(`Found ${emailRecipients.length} customers for ${targetAudience}`);
    }

    if (emailRecipients.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: "No customers found for the specified target audience"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    console.log(`Sending promotional email to ${emailRecipients.length} recipients:`, { subject, content });

    // Create the promotional email HTML template using store settings
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🛒 ${settings.store_name}</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${settings.store_tagline}</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e1e1e1; border-top: none;">
            <h2 style="color: #667eea; margin-top: 0;">${subject}</h2>
            
            <div style="margin: 20px 0; padding: 20px; background: #f8f9ff; border-left: 4px solid #667eea; border-radius: 0 5px 5px 0;">
              ${content}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${settings.website_url || '#'}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                Shop Now 🛍️
              </a>
            </div>
            
            <div style="border-top: 1px solid #e1e1e1; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #666;">
              <p><strong>Target Audience:</strong> ${targetAudience}</p>
              <p>Thank you for being a valued customer! Visit us in-store or shop online.</p>
              <p style="margin-top: 20px; font-size: 12px; color: #999;">
                ${settings.store_name} | ${settings.store_address} | ${settings.store_city}, ${settings.store_state} ${settings.store_zip}<br>
                <a href="#" style="color: #667eea;">Unsubscribe</a> | <a href="#" style="color: #667eea;">Update Preferences</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send individual emails to each recipient for better delivery
    console.log("About to send emails with Resend API...");
    console.log("API Key present:", !!Deno.env.get("RESEND_API_KEY"));
    console.log("Recipients:", emailRecipients);
    
    const emailResults = [];
    let successCount = 0;
    let failureCount = 0;
    
    for (const recipient of emailRecipients) {
      try {
        console.log(`Sending email to: ${recipient}`);
        const emailResponse = await resend.emails.send({
          from: `${settings.store_name} <onboarding@resend.dev>`,
          to: [recipient],
          subject: subject,
          html: htmlContent,
        });

        if (emailResponse.error) {
          console.error(`Failed to send email to ${recipient}:`, emailResponse.error);
          failureCount++;
          emailResults.push({ recipient, success: false, error: emailResponse.error.message });
        } else {
          console.log(`Successfully sent email to ${recipient}:`, emailResponse.data?.id);
          successCount++;
          emailResults.push({ recipient, success: true, emailId: emailResponse.data?.id });
        }
      } catch (error) {
        console.error(`Error sending email to ${recipient}:`, error);
        failureCount++;
        emailResults.push({ recipient, success: false, error: error.message });
      }
    }

    console.log(`Email sending complete: ${successCount} successful, ${failureCount} failed`);

    return new Response(JSON.stringify({
      success: true,
      message: `Promotional email sending complete: ${successCount} successful, ${failureCount} failed`,
      recipientCount: emailRecipients.length,
      successCount,
      failureCount,
      recipients: emailRecipients,
      results: emailResults
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-promotional-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Failed to send promotional email"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);