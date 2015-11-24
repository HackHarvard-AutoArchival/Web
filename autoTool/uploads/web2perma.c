/*
 * Some license I don't really care about
 *
 * Seriously, this is hackathon code and
 * you shouldn't probably be using it in
 * your project. Think twice, make it
 * thrice. Most of it is very closely
 * tailored to the data crunched at the
 * event and can have corner cases that
 * weren't tested as part of the sample
 * data.
 *
 *	- Shantanu Gupta <shans95g@gmail.com>
 */

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <curl/curl.h>


/*
 * Min, but with a twist.
 * If either of the arguments is zero then return the other one.
 */
#define MIN(a,b) (((a)<(b))? ((a) ? (a) : (b)):((b) ? (b) : (a)))

/*
 * Internal callback function to handle JSON response.
 */
static size_t JSONCallback(void *contents, size_t size, size_t nmemb, void *userp)
{
	char **ptr = userp;
	*ptr = realloc(*ptr, (size * nmemb) + 1);

	memcpy(*ptr, contents, size * nmemb);
	(*ptr)[size * nmemb] = '\0';

	return size * nmemb;
}

/*
 * Gateway to libcurl
 */
char *getPermaLink(char *URL)
{
	CURL *curl;
	CURLcode res;
	struct curl_slist *headers = NULL;
	char *JSONReq = malloc(32 + strlen(URL)), *JSONRes = NULL, *PermLnk = NULL;

	curl_global_init(CURL_GLOBAL_ALL);
	curl = curl_easy_init();
	if (!curl)
		return NULL;

	sprintf(JSONReq, "{\n\t\"url\": \"%s\",\n\t\"title\": \"\"\n}\n", URL);

	headers = curl_slist_append(headers, "Accept: application/json");
	headers = curl_slist_append(headers, "Content-Type: application/json");

	curl_easy_setopt(curl, CURLOPT_URL, "https://api.perma.cc/v1/archives/?api_key=4e4b3c5a831c61c77ae7343d91bcb7f548942ca0");
	curl_easy_setopt(curl, CURLOPT_SSL_VERIFYHOST, 0);
	curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, 0);
	curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, "POST");
	curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
	curl_easy_setopt(curl, CURLOPT_POST, 1);
	curl_easy_setopt(curl, CURLOPT_POSTFIELDS, JSONReq);
	curl_easy_setopt(curl, CURLOPT_POSTFIELDSIZE, strlen(JSONReq));
	curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, JSONCallback);
	curl_easy_setopt(curl, CURLOPT_WRITEDATA, (void *) &JSONRes);
	curl_easy_setopt(curl, CURLOPT_USERAGENT, "permacc++");
	res = curl_easy_perform(curl);
	curl_easy_cleanup(curl);
	curl_global_cleanup();
	free(JSONReq);

	char *idx = strstr(JSONRes, "\"guid\": \"");
	if (idx)
	{
		PermLnk = malloc(10);
		idx += 9;
		strncpy(PermLnk, idx, 9);
		PermLnk[9] = '\0';
	}
	free(JSONRes);

	return PermLnk;
}

/*
 * Append _perma to filename
 */
char *fNameGetPerma(char* fName) {

	char *r = malloc(strlen(fName) + 7);
	strcpy(r, fName);
	char *ext = strstr(r, ".json");

	if (ext)
	{
		strcpy(ext, "_perma");
		strcat(ext, ".json");
	} else {
		printf("Something went terribly wrong!\n");
	}

	return r;
}

/*
 * Handle pdf file, this is VERY HACKY!
 */
void pdf2perma(char *fNameIn)
{
	int e;
	char *cmd = malloc(11 + strlen(fNameIn));

	strcpy(cmd, "pdftotext ");
	strcat(cmd, fNameIn);

	e = system(cmd);
	free(cmd);

	if (e) {
		printf("E: Could not convert pdf to text :(\n");
		return;
	}

	char *fNameInTxt = strdup(fNameIn);
	char *fNameInExt = strstr(fNameInTxt, ".pdf");
	strcpy(fNameInExt, ".txt");

	FILE *fpIn = fopen(fNameInTxt, "r");
	unsigned fSizeIn;
	char *pStrIn;

	fseek(fpIn, 0, SEEK_END);
	fSizeIn = ftell(fpIn);
	rewind(fpIn);
	pStrIn = malloc(fSizeIn * sizeof(char));
	fread(pStrIn, sizeof(char), fSizeIn, fpIn);
	fclose(fpIn);
	fpIn = fopen(fNameInTxt, "w");

	char *cur = pStrIn, *end = pStrIn, *wrh = pStrIn;

	while(cur = strstr(cur, "http"))
	{
		if (cur[4] == 's'
		|| (cur[4] == ':'))
		{
			end = strchr(cur+1, ' ');
			end = MIN(strchr(cur, ';'), end);
			end = MIN(strchr(cur, '['), end);
			end = MIN(strstr(cur+1, "http"), end);
			end = MIN(strstr(cur, ".\n"), end);
			end = MIN(strstr(cur, ". "), end);
			end = MIN(strstr(cur, "\n\n"), end);

			if (end[-1] == '.')
			{
				end--;
			}

			end[0] = '\0';
			fprintf(fpIn, "%s ", wrh);
			char *cURL = strdup(cur);
			char *tURL = cURL;
			int i = 0;
			while (*tURL)
			{
				if (*tURL != ' '
				&& (*tURL != '\n')
				&& (!(tURL[0] == '\\' && tURL[1] == 'n'))
				&& (!(tURL[0] == 'n' && tURL[-1] == '\\'))
				)
					cURL[i++] = *tURL;
				tURL++;
			}
			cURL[i] = '\0';
			printf("%s\n", cURL);
			char *pLink = getPermaLink(cURL);
			free(cURL);
			end[0] = ' ';
			if (pLink) {
				fprintf(fpIn, "(http://perma.cc/%s)", pLink);
				free(pLink);
			}
			cur++;
			wrh = end;
		}
	}
	free(pStrIn);
	fclose(fpIn);
}

/*
 * This function handles json files, this is VERY HACKY!
 *
 * Most of it deals with the idiotic links in legal text
 *
 * Hall of Fame (in no specific order (split at whitespace, some extra parts
 *				preserved for user to understand that I'm not a psycho):
 *	http://www.whitehouse drugpolicy.gov/streetterms/ByType.asp?int TypeID =2
 *	Cocaine,\nhttp://www.whitehousedrugpolicy.gov/streetterms/ByType.asp?intTyp\neID=2
 *	http://www.usdoj.gov/oig/special/s 0608/full&#8212;report.pdf.</p>\n
 *	at\nhttp://www.usdoj.gov/oig/special/s0608/full_report.pdf.\n
 *	2011),\nhttp://www.census.gov/newsroom/releases/archives/2010_census/cb11\n-cn181.html;
 *	http://www.hcch.\n\nnet/upload/wop/abd_pd02efs2006.pdf
 *	http://www.nacdl.org/public.nsf/2cdd02b415ea 3a64852566d6000daa79/departures/$FILE/Rehnquist_letter.pdf.
 *	http://www.nacdl.org/ public.nsf/2cdd02b415ea3a64852566d6000daa79/departures/$FILE/stcg_ comm_current.pdf.
 *	http://www.epa.gov/OUST/ pubs/musts.pdf
 *	\"\nhttp://www.epa.gov/ogwdw/contaminants/dw_contamfs/benzene.html\n(last
 */

void web2perma(char *fNameIn)
{
	char *pdf = strstr(fNameIn, ".pdf");

	if (pdf && pdf[4] == '\0')
		return pdf2perma(fNameIn);

	char *pStrIn, *fNameOut = fNameGetPerma(fNameIn);
	unsigned fSizeIn;
	FILE *fpIn = fopen(fNameIn, "r"), *fpOut = fopen(fNameOut, "w+");

	if (!fpIn)
		printf("E: Could not open input file %s\n", fNameIn);
	if (!fpOut)
		printf("E: Could not open output file %s\n", fNameOut);

	if (!fpIn || !fpOut)
		return;

	fseek(fpIn, 0, SEEK_END);
	fSizeIn = ftell(fpIn);
	rewind(fpIn);
	pStrIn = malloc(fSizeIn * sizeof(char));
	fread(pStrIn, sizeof(char), fSizeIn, fpIn);
	fclose(fpIn);

	char *fin = strstr(pStrIn, "\"plain_text\"");
	char *p01 = strstr(pStrIn, "\"html");
	char *cur = p01 ? p01 : pStrIn;
	char *end = pStrIn, *wrh = pStrIn;

	while (cur = strstr(cur, "http"))
	{
		if (cur > fin)
			break;
		if ((cur[4] == 's')
		||  (cur[4] == ':'))
		{
			end = strchr(cur, '<');
			end = MIN(strchr(cur, '>'), end);
			end = MIN(strchr(cur, '%'), end);
			end = MIN(strchr(cur, '|'), end);
			end = MIN(strchr(cur, '^'), end);
			end = MIN(strchr(cur, '['), end);
			char *sc = strchr(cur, ';');
			char *am = strchr(cur, '&');
			if (am > sc)
				end = MIN(sc, end);
			end = MIN(strchr(cur, '('), end);
			end = MIN(strchr(cur, ')'), end);
			end = MIN(strchr(cur, ','), end);
			end = MIN(strchr(cur, '\''), end);
			end = MIN(strchr(cur, '\"'), end);
			end = MIN(strstr(cur+1, "http"), end);

			char *p = cur;
			for (;;) {
				p = strchr(p+1, '.');
				if (!p || p > end)
					break;
				if (p[1] == ' ')
				{
					if (p[2] < 'a' || p[2] > 'z')
						end = p;
				} else {
					if (p[1] < 'a' || p[1] > 'z')
						end = p;
				}
			}

			char t = end[0];
			end[0] = '\0';
			fprintf(fpOut, "%s", wrh);

			char *cURL = strdup(cur);
			char *tURL = cURL;
			int i = 0;
			while (*tURL)
			{
				if (*tURL != ' '
				&& (!(tURL[0] == '\\' && tURL[1] == 'n'))
				&& (!(tURL[0] == 'n' && tURL[-1] == '\\'))
				)
					cURL[i++] = *tURL;
				tURL++;
			}
			cURL[i] = '\0';
			p = cURL;
			for(;;) {
				p = strchr(p+1, '&');
				if (!p || p >= &cURL[strlen(cURL)])
					break;
				if (strncmp(p, "&#8212;", 7) == 0)
				{
					*p = '_';
					strcpy(p+1, p+7);
				} else if (strncmp(p, "&amp;", 5) == 0) {
					strcpy(p+1, p+5);
				} else if (strncmp(p, "&gt;", 4) == 0) {
					*p = '>';
					strcpy(p+1, p+4);
				}
			}
			printf("%s\n", cURL);
			char *pURL = getPermaLink(cURL);
			free(cURL);
			if (pURL)
			{
				fprintf(fpOut, " (http://perma.cc/%s)", pURL);
				free(pURL);
			} else {
				fprintf(fpOut, cur);  // I'm not really sure WTF I was doing, fix this later.
			}
			end[0] = t;

			wrh = end;
			cur = end + 1;
		}
		cur++;
	}

	fprintf(fpOut, "%s", wrh);
	fclose(fpOut);
	free(pStrIn);
	free(fNameOut);
}

int main(int argc, char *argv[])
{
	for (int i = 1; i < argc; i += 2)
		web2perma(argv[i]);
}

