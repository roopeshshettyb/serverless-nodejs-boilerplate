function basicMailHtmlStringContent({ heading, body }) {
    return `<table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
        <td align="center">
            <h1>${heading}</h1>
        </td>
    </tr>
    <tr>
        <td align="center">
            <h3>${body}</h3>
        </td>
    </tr>
</table>`;
}
module.exports = { basicMailHtmlStringContent };