function bareBonesHtmlString(backgroundColor, logo, customContent) {
    return `<!DOCTYPE html>
<html>

<head>
    <style>
        /* Styles removed from the <head> section */
    </style>
</head>

<body style="margin: 0; padding: 0; background-color: ${backgroundColor}; font-family: Raleway, sans-serif;">

    <div
        style="width: 70%; margin: 100px auto; background-color: white; padding: 20px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center">
                    <img src="${logo}" width="35%" style="max-width: 100%;" />
                </td>
            </tr>
        </table>
        ${customContent}
        <div style="text-align: center;align-content:center">
            <div style="display: flex; justify-content: center; align-items: center; margin-top: 20px;">
            </div>
            <table align="center" width="60%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                    <td align="center">
                       THANK YOU FOR CHOOSING FLASH PACT
                    </td>
                </tr>
            </table>
        </div>
        <br />
    </div>

</body>

</html>`;

}

module.exports = { bareBonesHtmlString };