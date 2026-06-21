function addYears(date, years) {
  const nextDate = new Date(date);
  nextDate.setFullYear(nextDate.getFullYear() + years);
  return nextDate;
}

async function expirePremiumSubscriptionForUser(user) {
  if (!user) {
    return user;
  }

  if (user.role !== "PREMIUM") {
    return user;
  }

  if (!user.subscriptionEndDate) {
    return user;
  }

  if (new Date(user.subscriptionEndDate).getTime() > Date.now()) {
    return user;
  }

  user.role = "GENERAL";
  await user.save();

  return user;
}

async function expirePremiumSubscriptionByUserId(userModel, userId) {
  if (!userModel || !userId) {
    return null;
  }

  const user = await userModel.findById(userId);
  return expirePremiumSubscriptionForUser(user);
}

module.exports = {
  addYears,
  expirePremiumSubscriptionForUser,
  expirePremiumSubscriptionByUserId,
};