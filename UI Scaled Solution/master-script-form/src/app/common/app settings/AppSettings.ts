export class AppSettings {

    public static regions: string[] = ['eu-west-1', 'eu-east-1', 'us-west-1', 'eu-west-2'];
    public static loadTypes: string[] = ['Direct', 'Proxy Offline', 'Proxy SharePoint'];
    public static loadTypeFieldTitles: string[] = ["ICAP Server Endpoint URL*", "Proxy IP Address*", "SharePoint Endpoint URL*"];
    public static testNames: string[] = ["ICAP Live Performance Dashboard", "Proxy Site Live Performance Dashboard", "SharePoint Proxy Live Performance Dashboard"];
    public static cookiesExist: boolean;
    public static testPrefixSet = new Set<string>();
    public static addingPrefix: boolean = false;
    public static serverIp: string = "http://127.0.0.1:5000/"
}
