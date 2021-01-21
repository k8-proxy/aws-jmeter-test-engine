export class AppSettings {

    public static regions: string[] = ['eu-west-1', 'eu-east-1', 'us-west-1', 'eu-west-2'];
    public static loadTypeNames: string[] = ['Direct', 'Proxy Offline', 'Proxy SharePoint'];
    public static loadTypeFieldTitles: string[] = ["ICAP Server Endpoint URL*", "Proxy IP Address*", "SharePoint Endpoint URL*"];
    public static endPointFieldPlaceholders: string[] = ["Required", "Ex: 12.34.56.78", "Ex: saas1.sharepoint.com"]
    public static endPointFieldDescriptions: string[] = ["*this field is required", "*this field is required, must be an IP address", "*this field is required, endpoint should not begin with http://"]
    public static testNames: string[] = ["ICAP Live Performance Dashboard", "Proxy Site Live Performance Dashboard", "SharePoint Proxy Live Performance Dashboard"];
    public static cookiesExist: boolean;
    public static testPrefixSet = new Set<string>();
    public static addingPrefix: boolean = false;
    public static serverIp: string = "http://127.0.0.1:5000/";
}
export enum LoadTypes { Direct = 0, ProxyOffline, ProxySharePoint }
